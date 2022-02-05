const { Spawn } = require("./spawn/spawn");
const { Vector, world } = require("../wrapper/api");
const Rotator = require("../mock/mock-rotator");
const { AbstractSetup } = require("./abstract-setup");

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
        nsid: "tile.strategy:codex.ordinian/diplomacy",
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
        nsid: "tile.strategy:base/construction",
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
