const assert = require("../wrapper/assert-wrapper");
const { AbstractSetup } = require("./abstract-setup");
const { Spawn } = require("./spawn/spawn");
const { Rotator, world } = require("../wrapper/api");
const { ObjectNamespace } = require("../lib/object-namespace");

const STRATEGY_CARDS = [
    {
        nsid: "tile.strategy:base/leadership",
        snapPointIndex: 0,
    },
    {
        nsid: "tile.strategy:base/diplomacy.errata",
        snapPointIndex: 1,
    },
    {
        nsid: "tile.strategy:base/politics",
        snapPointIndex: 2,
    },
    {
        nsid: "tile.strategy:base/construction.errata",
        snapPointIndex: 3,
    },
    {
        nsid: "tile.strategy:base/trade",
        snapPointIndex: 4,
    },
    {
        nsid: "tile.strategy:base/warfare",
        snapPointIndex: 5,
    },
    {
        nsid: "tile.strategy:base/technology",
        snapPointIndex: 6,
    },
    {
        nsid: "tile.strategy:base/imperial",
        snapPointIndex: 7,
    },
];

class SetupStrategyCards extends AbstractSetup {
    constructor() {
        super();
    }

    setup() {
        let mat = false;
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid !== "mat:base/strategy_card") {
                continue;
            }
            mat = obj;
            break;
        }
        assert(mat);
        const snapPoints = mat.getAllSnapPoints();

        for (const strategyCard of STRATEGY_CARDS) {
            const snapPoint = snapPoints[strategyCard.snapPointIndex];
            assert(snapPoint);
            const pos = snapPoint.getGlobalPosition().add([0, 0, 3]);
            const yaw = snapPoint.getSnapRotation();
            const rot = new Rotator(0, yaw, 0);
            const obj = Spawn.spawn(strategyCard.nsid, pos, rot);
            obj.snap();
        }
    }

    clean() {
        for (const obj of world.getAllObjects()) {
            if (ObjectNamespace.isStrategyCard(obj)) {
                obj.setTags(["DELETED_ITEMS_IGNORE"]);
                obj.destroy();
            }
        }
    }
}

module.exports = { SetupStrategyCards, STRATEGY_CARDS };
