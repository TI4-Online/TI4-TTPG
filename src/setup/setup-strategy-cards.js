const { AbstractSetup } = require("./abstract-setup");
const { Spawn } = require("./spawn/spawn");
const { Rotator, Vector, world } = require("../wrapper/api");
const { ObjectNamespace } = require("../lib/object-namespace");

let _nextX = -40;
function nextPosition() {
    const result = {
        x: _nextX,
        y: -90,
        z: world.getTableHeight() + 5,
    };
    _nextX += 10;
    return result;
}

const STRATEGY_CARDS = [
    {
        nsid: "tile.strategy:base/leadership",
        parent: false,
        pos: nextPosition(),
        yaw: -90,
    },
    {
        nsid: "tile.strategy:base/diplomacy.errata",
        parent: false,
        pos: nextPosition(),
        yaw: -90,
    },
    {
        nsid: "tile.strategy:base/politics",
        parent: false,
        pos: nextPosition(),
        yaw: -90,
    },
    {
        nsid: "tile.strategy:pok/construction",
        parent: false,
        pos: nextPosition(),
        yaw: -90,
    },
    {
        nsid: "tile.strategy:base/trade",
        parent: false,
        pos: nextPosition(),
        yaw: -90,
    },
    {
        nsid: "tile.strategy:base/warfare",
        parent: false,
        pos: nextPosition(),
        yaw: -90,
    },
    {
        nsid: "tile.strategy:base/technology",
        parent: false,
        pos: nextPosition(),
        yaw: -90,
    },
    {
        nsid: "tile.strategy:base/imperial",
        parent: false,
        pos: nextPosition(),
        yaw: -90,
    },
];

class SetupStrategyCards extends AbstractSetup {
    constructor() {
        super();
    }

    setup() {
        for (const strategyCard of STRATEGY_CARDS) {
            this._setupStrategyCard(strategyCard);
        }
    }

    clean() {
        for (const obj of world.getAllObjects()) {
            if (ObjectNamespace.isStrategyCard(obj)) {
                obj.destroy();
            }
        }
    }

    _setupStrategyCard(strategyCard) {
        const pos = new Vector(
            strategyCard.pos.x,
            strategyCard.pos.y,
            strategyCard.pos.z
        );
        const rot = new Rotator(0, strategyCard.yaw, 0);
        Spawn.spawn(strategyCard.nsid, pos, rot);
    }
}

module.exports = { SetupStrategyCards };
