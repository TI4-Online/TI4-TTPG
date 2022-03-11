const assert = require("../wrapper/assert-wrapper");
const { AbstractSetup } = require("./abstract-setup");
const { ObjectNamespace } = require("../lib/object-namespace");
const { TableLayout } = require("../table/table-layout");
const { Card, Rotator, Vector, world } = require("../wrapper/api");

const TABLE_DECKS = [
    {
        nsidPrefix: "card.action",
        parent: {
            nsid: "mat:base/decks",
            snapPoint: 3,
        },
    },
    {
        nsidPrefix: "card.agenda",
        parent: {
            nsid: "mat:base/decks",
            snapPoint: 4,
        },
    },
    {
        nsidPrefix: "card.objective.secret",
        parent: {
            nsid: "mat:base/decks",
            snapPoint: 5,
        },
    },
    {
        nsidPrefix: "card.objective.public_1",
        parent: {
            nsid: "mat:base/objectives_1",
            snapPoint: 5,
        },
    },
    {
        nsidPrefix: "card.objective.public_2",
        parent: {
            nsid: "mat:base/objectives_2",
            snapPoint: 5,
        },
    },
    {
        nsidPrefix: "card.planet",
        parent: {
            nsid: "mat:base/decks",
            snapPoint: 2,
        },
    },
    {
        nsidPrefix: "card.relic",
        parent: {
            nsid: "mat:pok/exploration",
            snapPoint: 9,
        },
    },
    {
        nsidPrefix: "card.exploration.cultural",
        parent: {
            nsid: "mat:pok/exploration",
            snapPoint: 8,
        },
    },
    {
        nsidPrefix: "card.exploration.hazardous",
        parent: {
            nsid: "mat:pok/exploration",
            snapPoint: 7,
        },
    },
    {
        nsidPrefix: "card.exploration.industrial",
        parent: {
            nsid: "mat:pok/exploration",
            snapPoint: 6,
        },
    },
    {
        nsidPrefix: "card.exploration.frontier",
        parent: {
            nsid: "mat:pok/exploration",
            snapPoint: 5,
        },
    },
    {
        nsidPrefix: "card.legendary_planet",
        parent: {
            nsid: "mat:pok/exploration",
            snapPoint: 4,
        },
    },
    {
        nsidPrefix: "card.faction_token",
        anchor: TableLayout.anchor.score,
        pos: { x: 30, y: -33, z: 5 },
        yaw: -90,
    },
    {
        nsidPrefix: "card.faction_reference",
        anchor: TableLayout.anchor.score,
        pos: { x: 30, y: -26, z: 5 },
        yaw: -90,
    },
];

class SetupTableDecks extends AbstractSetup {
    constructor() {
        super();
    }

    setup() {
        const nsidSet = new Set();
        for (const deckData of TABLE_DECKS) {
            if (deckData.parent) {
                nsidSet.add(deckData.parent.nsid);
            }
        }

        const nsidToMat = {};
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (!nsid.startsWith("mat:")) {
                continue;
            }
            if (!nsidSet.has(nsid)) {
                continue;
            }
            assert(!nsidToMat[nsid]);
            nsidToMat[nsid] = obj;
        }

        for (const deckData of TABLE_DECKS) {
            const mat = deckData.parent
                ? nsidToMat[deckData.parent.nsid]
                : false;
            this._setupDeck(deckData, mat);
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

    _setupDeck(deckData, mat) {
        let pos;
        let rot;

        // If have a mat, use a snap point.
        if (mat) {
            const snapPoints = mat.getAllSnapPoints();
            const snapPoint = snapPoints[deckData.parent.snapPoint];
            if (snapPoint) {
                pos = snapPoint.getGlobalPosition().add([0, 0, 10]);
                const yaw = mat.getRotation().yaw + snapPoint.getSnapRotation();
                rot = new Rotator(0, yaw, 0);
            }
        } else {
            pos = new Vector(deckData.pos.x, deckData.pos.y, deckData.pos.z);
            rot = new Rotator(0, deckData.yaw, 0);
            if (deckData.anchor) {
                pos = this.anchorPositionToWorld(deckData.anchor, pos);
                rot = this.anchorRotationToWorld(deckData.anchor, rot);
            }
            pos.z = world.getTableHeight() + deckData.pos.z;
        }

        // Spawn the decks, combine into one.
        const deck = this.spawnDecksThenFilter(
            pos,
            rot,
            deckData.nsidPrefix,
            (nsid) => {
                if (nsid.startsWith("card.planet")) {
                    // Ignore home system cards.
                    const planet = world.TI4.getPlanetByCardNsid(nsid);
                    if (planet) {
                        return !planet.system.raw.home;
                    }
                }
                return true; // no need to filter anything
            }
        );

        if (mat) {
            deck.snap();
        }
    }
}

module.exports = { SetupTableDecks };
