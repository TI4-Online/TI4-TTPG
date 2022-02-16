const { AbstractSetup } = require("./abstract-setup");
const { ObjectNamespace } = require("../lib/object-namespace");
const { Card, Rotator, Vector, world } = require("../wrapper/api");

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

    clean() {
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue; // ignore inside containers
            }
            if (!(obj instanceof Card)) {
                continue;
            }
            const nsids = ObjectNamespace.getDeckNsids(obj);
            const nsid = nsids[0];
            for (const deckData of TABLE_DECKS) {
                if (nsid.startsWith(deckData.nsidPrefix)) {
                    obj.destroy();
                    break;
                }
            }
        }
    }

    _setupDeck(deckData) {
        const pos = new Vector(deckData.pos.x, deckData.pos.y, deckData.pos.z);
        const rot = new Rotator(0, deckData.yaw, 0);

        // Spawn the decks, combine into one.
        this.spawnDecksThenFilter(pos, rot, deckData.nsidPrefix, (nsid) => {
            if (nsid.startsWith("card.planet")) {
                // Ignore home system cards.
                const planet = world.TI4.getPlanetByCardNsid(nsid);
                if (planet) {
                    return !planet.system.raw.home;
                }
            }
            return true; // no need to filter anything
        });
    }
}

module.exports = { SetupTableDecks };
