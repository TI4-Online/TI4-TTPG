const assert = require("../wrapper/assert-wrapper");
const locale = require("../lib/locale");
const { AbstractSetup } = require("./abstract-setup");
const { ColorUtil } = require("../lib/color/color-util");
const { ObjectNamespace } = require("../lib/object-namespace");
const { Spawn } = require("./spawn/spawn");
const { TableLayout } = require("../table/table-layout");
const { ObjectType, Rotator, Vector, world } = require("../wrapper/api");

const EXPLORATION_TOKENS = {
    bagNsid: "bag:base/generic",
    bagHexColor: "#505050",
    bagScale: { x: 0.8, y: 0.8, z: 0.5 },
    tokens: [
        { nsidPrefix: "token.attachment.exploration" },
        { nsidPrefix: "token.wormhole.exploration" },
        { nsidPrefix: "token.exploration" },
    ],
    anchor: TableLayout.anchor.score,
    crateIndex: 2,
    yaw: 0,
};

const GENERIC_TOKENS = [
    {
        tokenNsid: "token:pok/frontier",
        bagNsid: "bag.token:pok/frontier",
        bagType: 1, // infinite
        bagScale: { x: 0.8, y: 0.8, z: 0.8 },
        anchor: TableLayout.anchor.score,
        crateIndex: 4,
        yaw: 0,
    },
    {
        tokenNsid: "token:base/speaker",
        bagNsid: false,
        bagType: false,
        anchor: TableLayout.anchor.score,
        pos: { x: -45, y: -15, z: 3 },
        yaw: 0,
    },
    {
        tokenNsid: "token:base/custodians",
        bagNsid: false,
        bagType: false,
        anchor: TableLayout.anchor.score,
        pos: { x: -45, y: 15, z: 3 },
        yaw: 0,
    },

    // scoreboard is in setup-table-mats
];

class SetupTableTokens extends AbstractSetup {
    constructor() {
        super();
    }

    setup() {
        this._setupExplorationTokens();
        GENERIC_TOKENS.forEach((tokenData) => {
            this._setupGenericToken(tokenData);
        });

        // Move custodians token to mat (if present).
        let custodiansToken = undefined;
        let custodiansMat = undefined;
        const skipContained = true;
        for (const obj of world.getAllObjects(skipContained)) {
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid === "token:base/custodians") {
                custodiansToken = obj;
            } else if (nsid === "mat:base/custodians") {
                custodiansMat = obj;
            }
        }
        if (custodiansToken && custodiansMat) {
            const pos = custodiansMat.getPosition().add([0, 0, 3]);
            custodiansToken.setPosition(pos);
            custodiansToken.snapToGround();
        }
    }

    clean() {
        const destroyNsids = new Set();
        for (const genericToken of GENERIC_TOKENS) {
            destroyNsids.add(genericToken.tokenNsid);
            if (genericToken.bagNsid) {
                destroyNsids.add(genericToken.bagNsid);
            }
        }
        const tokenNsidPrefixes = [];
        for (const tokenData of EXPLORATION_TOKENS.tokens) {
            tokenNsidPrefixes.push(tokenData.nsidPrefix);
        }

        for (const obj of world.getAllObjects()) {
            const nsid = ObjectNamespace.getNsid(obj);
            let needsDestroy = destroyNsids.has(nsid);
            if (!needsDestroy) {
                for (const tokenNsidPrefix of tokenNsidPrefixes) {
                    if (nsid.startsWith(tokenNsidPrefix)) {
                        needsDestroy = true;
                        break;
                    }
                }
            }
            if (needsDestroy) {
                const container = obj.getContainer();
                if (container) {
                    const above = container.getPosition().add([0, 0, 10]);
                    if (container.take(obj, above)) {
                        obj.setTags(["DELETED_ITEMS_IGNORE"]);
                        obj.destroy();
                    }
                } else {
                    obj.setTags(["DELETED_ITEMS_IGNORE"]);
                    obj.destroy();
                }
            }
        }
    }

    _setupExplorationTokens() {
        let pos = AbstractSetup.getCrateAreaLocalPosition(
            EXPLORATION_TOKENS.crateIndex
        );
        let rot = new Rotator(0, EXPLORATION_TOKENS.yaw, 0);

        if (EXPLORATION_TOKENS.anchor) {
            pos = TableLayout.anchorPositionToWorld(
                EXPLORATION_TOKENS.anchor,
                pos
            );
            rot = TableLayout.anchorRotationToWorld(
                EXPLORATION_TOKENS.anchor,
                rot
            );
        }
        pos.z = world.getTableHeight() + 3;

        const bag = Spawn.spawn(EXPLORATION_TOKENS.bagNsid, pos, rot);
        bag.setName(locale("bag.exploration_tokens"));
        bag.clear(); // paranoia
        bag.setObjectType(ObjectType.Regular); // needs to be regular to explore
        if (EXPLORATION_TOKENS.bagHexColor) {
            bag.setPrimaryColor(
                ColorUtil.colorFromHex(EXPLORATION_TOKENS.bagHexColor)
            );
        }
        if (EXPLORATION_TOKENS.bagScale) {
            bag.setScale(
                new Vector(
                    EXPLORATION_TOKENS.bagScale.x,
                    EXPLORATION_TOKENS.bagScale.y,
                    EXPLORATION_TOKENS.bagScale.z
                )
            );
        }

        const above = pos.add([0, 0, 10]);
        const nsids = Spawn.getAllNSIDs().filter((nsid) => {
            for (const tokenData of EXPLORATION_TOKENS.tokens) {
                if (nsid.startsWith(tokenData.nsidPrefix)) {
                    return true;
                }
            }
        });
        nsids.forEach((nsid) => {
            let count = 1;
            if (nsid === "token.wormhole.exploration:pok/gamma") {
                count = 3;
            }
            for (let i = 0; i < count; i++) {
                const token = Spawn.spawn(nsid, above, rot);
                bag.addObjects([token]);
            }
        });
    }

    _setupGenericToken(tokenData) {
        let pos;
        if (tokenData.pos) {
            pos = new Vector(tokenData.pos.x, tokenData.pos.y, tokenData.pos.z);
        } else {
            assert(tokenData.crateIndex !== undefined);
            pos = AbstractSetup.getCrateAreaLocalPosition(tokenData.crateIndex);
        }

        let rot = new Rotator(0, tokenData.yaw, 0);

        if (tokenData.anchor) {
            pos = TableLayout.anchorPositionToWorld(tokenData.anchor, pos);
            rot = TableLayout.anchorRotationToWorld(tokenData.anchor, rot);
        }
        pos.z = world.getTableHeight() + 3;

        let bag;
        if (tokenData.bagNsid) {
            bag = Spawn.spawn(tokenData.bagNsid, pos, rot);
            bag.clear(); // paranoia
            bag.setObjectType(ObjectType.Ground);
            bag.setType(tokenData.bagType);

            if (tokenData.bagScale) {
                bag.setScale(
                    new Vector(
                        tokenData.bagScale.x,
                        tokenData.bagScale.y,
                        tokenData.bagScale.z
                    )
                );
            }
        }

        const tokenPos = bag ? pos.add([0, 0, 10]) : pos;
        const token = Spawn.spawn(tokenData.tokenNsid, tokenPos, rot);
        if (bag) {
            bag.addObjects([token]);
        }
    }
}

module.exports = { SetupTableTokens };
