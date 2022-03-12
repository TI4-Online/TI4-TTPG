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
    pos: { x: 5, y: 25, z: 3 },
    yaw: -90,
};

const GENERIC_TOKENS = [
    {
        tokenNsid: "token:pok/frontier",
        bagNsid: "bag.token:pok/frontier",
        bagType: 2,
        bagScale: { x: 0.8, y: 0.8, z: 0.8 },
        anchor: TableLayout.anchor.score,
        pos: { x: 14, y: 25, z: 3 },
        yaw: 0,
    },
    {
        tokenNsid: "token:base/speaker",
        bagNsid: false,
        bagType: false,
        anchor: TableLayout.anchor.score,
        pos: { x: -30, y: -25, z: 3 },
        yaw: 90,
    },
    {
        tokenNsid: "token:base/custodians",
        bagNsid: false,
        bagType: false,
        anchor: TableLayout.anchor.score,
        pos: { x: -30, y: -31, z: 3 },
        yaw: 90,
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
                        obj.destroy();
                    }
                } else {
                    obj.destroy();
                }
            }
        }
    }

    _setupExplorationTokens() {
        let pos = new Vector(
            EXPLORATION_TOKENS.pos.x,
            EXPLORATION_TOKENS.pos.y,
            EXPLORATION_TOKENS.pos.z
        );
        let rot = new Rotator(0, EXPLORATION_TOKENS.yaw, 0);

        if (EXPLORATION_TOKENS.anchor) {
            pos = this.anchorPositionToWorld(EXPLORATION_TOKENS.anchor, pos);
            rot = this.anchorRotationToWorld(EXPLORATION_TOKENS.anchor, rot);
        }
        pos.z = world.getTableHeight() + EXPLORATION_TOKENS.pos.z;

        const bag = Spawn.spawn(EXPLORATION_TOKENS.bagNsid, pos, rot);
        bag.setName(locale("bag.exploration_tokens"));
        bag.clear(); // paranoia
        bag.setObjectType(ObjectType.Regular);
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
                token.setSnappingAllowed(false);
                bag.addObjects([token]);
            }
        });
    }

    _setupGenericToken(tokenData) {
        let pos = new Vector(tokenData.pos.x, tokenData.pos.y, tokenData.pos.z);
        let rot = new Rotator(0, tokenData.yaw, 0);

        if (tokenData.anchor) {
            pos = this.anchorPositionToWorld(tokenData.anchor, pos);
            rot = this.anchorRotationToWorld(tokenData.anchor, rot);
        }
        pos.z = world.getTableHeight() + tokenData.pos.z;

        let bag;
        if (tokenData.bagNsid) {
            bag = Spawn.spawn(tokenData.bagNsid, pos, rot);
            bag.clear(); // paranoia
            bag.setObjectType(ObjectType.Regular);

            // Bag needs to have the correct type at create time.
            if (bag.getType() !== tokenData.bagType) {
                bag.setType(tokenData.bagType);
                const json = bag.toJSONString();
                bag.destroy();
                bag = world.createObjectFromJSON(json, pos);
                bag.setRotation(rot);
            }

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
        token.setSnappingAllowed(false);
        if (bag) {
            bag.addObjects([token]);
        }
    }
}

module.exports = { SetupTableTokens };
