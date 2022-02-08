const { AbstractSetup } = require("./abstract-setup");
const { Spawn } = require("./spawn/spawn");
const { ObjectType, Rotator, Vector, world } = require("../wrapper/api");

const EXPLORATION_TOKENS = {
    bagNsid: "bag:base/garbage",
    tokens: [
        { nsidPrefix: "token.attachment.exploration" },
        { nsidPrefix: "token.wormhole.exploration" },
        { nsidPrefix: "token.exploration" },
    ],
    pos: { x: -40, y: -75, z: world.getTableHeight() + 5 },
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
    // SCOREBOARD AWAITING TEMPLATE
    // {
    //     tokenNsid: "token:base/scoreboard",
    //     bagNsid: false,
    //     bagType: false,
    //     pos: { x: 5, y: -75, z: world.getTableHeight() + 5, },
    //     yaw: 0,
    // },
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
            const token = Spawn.spawn(nsid, above, rot);
            bag.addObjects([token]);
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
        if (bag) {
            bag.addObjects([token]);
        }
    }
}

module.exports = { SetupTableTokens };
