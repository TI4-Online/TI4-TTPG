const { Rotator, Vector, world } = require("../wrapper/api");
const { AbstractSetup } = require("./abstract-setup");

let _nextX = -40;
function nextPosition() {
    const result = {
        x: _nextX,
        y: -100,
        z: world.getTableHeight() + 5,
    };
    _nextX += 6;
    return result;
}

const TABLE_DECKS = [
    {
        nsidPrefix: "card.action",
        parent: false,
        pos: nextPosition(),
        yaw: -90,
    },
    {
        nsidPrefix: "card.agenda",
        parent: false,
        pos: nextPosition(),
        yaw: -90,
    },
    {
        nsidPrefix: "card.objective.secret",
        parent: false,
        pos: nextPosition(),
        yaw: -90,
    },
    {
        nsidPrefix: "card.objective.public_1",
        parent: false,
        pos: nextPosition(),
        yaw: -90,
    },
    {
        nsidPrefix: "card.objective.public_2",
        parent: false,
        pos: nextPosition(),
        yaw: -90,
    },
    {
        nsidPrefix: "card.planet",
        parent: false,
        pos: nextPosition(),
        yaw: -90,
    },
    {
        nsidPrefix: "card.relic",
        parent: false,
        pos: nextPosition(),
        yaw: -90,
    },
    {
        nsidPrefix: "card.exploration.cultural",
        parent: false,
        pos: nextPosition(),
        yaw: -90,
    },
    {
        nsidPrefix: "card.exploration.hazardous",
        parent: false,
        pos: nextPosition(),
        yaw: -90,
    },
    {
        nsidPrefix: "card.exploration.industrial",
        parent: false,
        pos: nextPosition(),
        yaw: -90,
    },
    {
        nsidPrefix: "card.exploration.frontier",
        parent: false,
        pos: nextPosition(),
        yaw: -90,
    },
    {
        nsidPrefix: "card.legendary_planet",
        parent: false,
        pos: nextPosition(),
        yaw: -90,
    },
    {
        nsidPrefix: "card.faction_token",
        parent: false,
        pos: nextPosition(),
        yaw: -90,
    },
    {
        nsidPrefix: "card.faction_reference",
        parent: false,
        pos: nextPosition(),
        yaw: -90,
    },
];

class SetupTableDecks extends AbstractSetup {
    constructor() {
        super();
    }

    setup() {
        for (const deckData of TABLE_DECKS) {
            this._setupDeck(deckData);
        }
    }

    _setupDeck(deckData) {
        const pos = new Vector(deckData.pos.x, deckData.pos.y, deckData.pos.z);
        const rot = new Rotator(0, deckData.yaw, 0);

        // Spawn the decks, combine into one.
        this.spawnDecksThenFilter(pos, rot, deckData.nsidPrefix, (nsid) => {
            return true; // no need to filter anything
        });
    }
}

module.exports = { SetupTableDecks };
