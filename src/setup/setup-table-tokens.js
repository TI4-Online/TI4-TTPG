const { AbstractSetup } = require("./abstract-setup");
const { ObjectNamespace } = require("../lib/object-namespace");
const { Spawn } = require("./spawn/spawn");
const { ObjectType, Rotator, Vector, world } = require("../wrapper/api");

const EXPLORATION_TOKENS = {
    bagNsid: "bag:base/garbage",
    tokens: [
        { nsidPrefix: "token.attachment.exploration" },
        { nsidPrefix: "token.wormhole.exploration" },
        { nsidPrefix: "token.exploration" },
    ],
    pos: { x: -38, y: 98, z: world.getTableHeight() + 5 },
    yaw: 0,
};

const GENERIC_TOKENS = [
    {
        tokenNsid: "token:pok/frontier",
        bagNsid: "bag.token:pok/frontier",
        bagType: 2,
        pos: { x: -25, y: -75, z: world.getTableHeight() + 5 },
        yaw: 0,
    },
    {
        tokenNsid: "token:base/speaker",
        bagNsid: false,
        bagType: false,
        pos: { x: -10, y: -75, z: world.getTableHeight() + 5 },
        yaw: -90,
    },
    {
        tokenNsid: "token:base/custodians",
        bagNsid: false,
        bagType: false,
        pos: { x: 0, y: -75, z: world.getTableHeight() + 5 },
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
        const pos = new Vector(
            EXPLORATION_TOKENS.pos.x,
            EXPLORATION_TOKENS.pos.y,
            EXPLORATION_TOKENS.pos.z
        );
        const rot = new Rotator(0, EXPLORATION_TOKENS.yaw, 0);

        const bag = Spawn.spawn(EXPLORATION_TOKENS.bagNsid, pos, rot);
        bag.clear(); // paranoia
        bag.setObjectType(ObjectType.Regular);

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
        const pos = new Vector(
            tokenData.pos.x,
            tokenData.pos.y,
            tokenData.pos.z
        );
        const rot = new Rotator(0, tokenData.yaw, 0);

        let bag;
        if (tokenData.bagNsid) {
            bag = Spawn.spawn(tokenData.bagNsid, pos, rot);
            bag.clear(); // paranoia
            bag.setObjectType(ObjectType.Regular);
            bag.setScript("");
            bag.setName("tokens");

            // Bag needs to have the correct type at create time.
            if (bag.getType() !== tokenData.bagType) {
                bag.setType(tokenData.bagType);
                const json = bag.toJSONString();
                bag.destroy();
                bag = world.createObjectFromJSON(json, pos);
                bag.setRotation(rot);
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
