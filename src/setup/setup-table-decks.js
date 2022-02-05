const { ObjectNamespace } = require("../lib/object-namespace");
const { ReplaceObjects } = require("./spawn/replace-objects");
const { Spawn } = require("./spawn/spawn");
const { Vector, world } = require("../wrapper/api");
const Rotator = require("../mock/mock-rotator");

let _nextX = -40;
function nextPosition() {
    const result = {
        x: _nextX,
        y: -100,
        z: world.getTableHeight() + 5,
    };
    _nextX += 7;
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
];

class SetupTableDecks {
    static setup() {
        for (const deckData of TABLE_DECKS) {
            SetupTableDecks._setupDeck(deckData);
        }
    }

    static _setupDeck(deckData) {
        const pos = new Vector(deckData.pos.x, deckData.pos.y, deckData.pos.z);
        const rot = new Rotator(0, deckData.yaw, 0);

        const mergeDeckNsids = Spawn.getAllNSIDs().filter((nsid) => {
            // Get the DECK nsids, will need to merge into one deck.
            const parsedNsid = ObjectNamespace.parseNsid(nsid);
            if (parsedNsid.source.startsWith("homebrew")) {
                return false; // ignore homebrew
            }
            if (parsedNsid.source.startsWith("franken")) {
                return false; // ignore franken
            }
            return parsedNsid.type.startsWith(deckData.nsidPrefix);
        });
        mergeDeckNsids.sort();

        // Spawn the decks, combine into one.
        let deck = false;
        mergeDeckNsids.forEach((mergeDeckNsid) => {
            const mergeDeck = Spawn.spawn(mergeDeckNsid, pos, rot);
            if (deck) {
                deck.addCards(mergeDeck);
            } else {
                deck = mergeDeck;
            }
        });

        // Apply replacement rules ("x.omega")
        ReplaceObjects.getReplacedObjects([deck]).forEach((replacedObj) => {
            replacedObj.destroy();
        });
    }
}

module.exports = { SetupTableDecks };
