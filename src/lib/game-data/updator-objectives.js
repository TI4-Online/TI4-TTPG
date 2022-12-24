const assert = require("../../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../object-namespace");
const { ObjectSavedData } = require("../saved-data/object-saved-data");
const { Card, GameObject, world } = require("../../wrapper/api");

const OTHER_SCORABLE_NSIDS = new Set([
    "card.action:base/imperial_rider",
    "card.agenda:base.only/holy_planet_of_ixth",
    "card.agenda:base.only/shard_of_the_throne",
    "card.agenda:base.only/the_crown_of_emphidia",
    "card.agenda:base/mutiny",
    "card.agenda:base/seed_of_an_empire",
    "card.agenda:pok/political_censure",
    "card.relic:pok/shard_of_the_throne",
    "card.relic:pok/the_crown_of_emphidia",
]);

module.exports = (data) => {
    assert(data.players.length === world.TI4.config.playerCount);
    data.players.forEach((playerData) => {
        playerData.objectives = [];
    });

    const controlTokens = [];
    const objectiveCards = [];

    for (const obj of world.getAllObjects()) {
        if (obj.getContainer()) {
            continue;
        }

        // Watch out for objects currently being moved.
        if (obj.isHeld()) {
            continue;
        }

        // Find control tokens.
        if (ObjectNamespace.isControlToken(obj)) {
            controlTokens.push(obj);
            continue; // make sure later cannot add again
        }

        // At this point everything is a card.  Secrets can be in card holders!
        if (!(obj instanceof Card)) {
            continue;
        }
        if (!obj.isFaceUp()) {
            continue;
        }
        const cardHolder = obj.getHolder();
        if (cardHolder && cardHolder.getOwningPlayerSlot() !== -1) {
            continue; // in a player's hand
        }

        // Find objective cards.  Can be in a card holder (secrets)!
        const nsid = ObjectNamespace.getNsid(obj);
        if (nsid.startsWith("card.objective.")) {
            objectiveCards.push(obj);
            continue; // make sure later cannot add again
        }

        // Find SFTT cards.
        if (
            nsid.startsWith("card.promissory") &&
            nsid.endsWith("support_for_the_throne")
        ) {
            objectiveCards.push(obj);
            continue; // make sure later cannot add again
        }

        // Other scorables.
        if (OTHER_SCORABLE_NSIDS.has(nsid)) {
            objectiveCards.push(obj);
            continue; // make sure later cannot add again
        }
    }

    const playerDesks = world.TI4.getAllPlayerDesks();
    const playerSlotToObjectiveNames = {};
    objectiveCards.forEach((card) => {
        // Find objectives with tokens on them.
        controlTokens
            .filter((token) => {
                let pos = token.getPosition();
                pos = card.worldPositionToLocal(pos);
                // card size is 6.3x 4.2y
                return Math.abs(pos.x) < 3.5 && Math.abs(pos.y) < 2.4;
            })
            .forEach((token) => {
                // token on card.
                const playerSlot = token.getOwningPlayerSlot();
                let objectiveNames = playerSlotToObjectiveNames[playerSlot];
                if (!objectiveNames) {
                    objectiveNames = [];
                    playerSlotToObjectiveNames[playerSlot] = objectiveNames;
                }
                const objectiveName = card.getCardDetails().name;
                if (!objectiveNames.includes(objectiveName)) {
                    objectiveNames.push(objectiveName);
                }
            });

        // Find objectives inside secrets holers.
        const cardHolder = card instanceof Card ? card.getHolder() : false;
        if (cardHolder) {
            const deskIndex = ObjectSavedData.get(cardHolder, "deskIndex");
            if (deskIndex !== undefined) {
                const playerDesk = playerDesks[deskIndex];
                if (playerDesk) {
                    const playerSlot = playerDesk.playerSlot;
                    let objectiveNames = playerSlotToObjectiveNames[playerSlot];
                    if (!objectiveNames) {
                        objectiveNames = [];
                        playerSlotToObjectiveNames[playerSlot] = objectiveNames;
                    }
                    const objectiveName = card.getCardDetails().name;
                    if (!objectiveNames.includes(objectiveName)) {
                        objectiveNames.push(objectiveName);
                    }
                }
            }
        }
    });

    // Show objectives in snap-point order.
    const sortBySnapPoints = (a, b) => {
        assert(a instanceof GameObject);
        assert(b instanceof GameObject);
        const aSnap = a.getSnappedToPoint();
        const bSnap = b.getSnappedToPoint();
        const aIdx = aSnap ? aSnap.getIndex() : -1;
        const bIdx = bSnap ? bSnap.getIndex() : -1;
        return bIdx - aIdx;
    };

    // Report all objectives, even those not scored.
    const addedNsids = new Set();
    data.objectives = {
        "Public Objectives I": objectiveCards
            .filter((obj) => {
                const nsid = ObjectNamespace.getNsid(obj);
                return nsid.startsWith("card.objective.public_1");
            })
            .sort(sortBySnapPoints)
            .map((obj) => {
                const nsid = ObjectNamespace.getNsid(obj);
                addedNsids.add(nsid);
                return obj.getCardDetails().name;
            }),
        "Public Objectives II": objectiveCards
            .filter((obj) => {
                const nsid = ObjectNamespace.getNsid(obj);
                return nsid.startsWith("card.objective.public_2");
            })
            .sort(sortBySnapPoints)
            .map((obj) => {
                const nsid = ObjectNamespace.getNsid(obj);
                addedNsids.add(nsid);
                return obj.getCardDetails().name;
            }),
        "Secret Objectives": objectiveCards
            .filter((obj) => {
                const nsid = ObjectNamespace.getNsid(obj);
                return nsid.startsWith("card.objective.secret");
            })
            .map((obj) => {
                const nsid = ObjectNamespace.getNsid(obj);
                addedNsids.add(nsid);
                return obj.getCardDetails().name;
            }),
        Agenda: objectiveCards
            .filter((obj) => {
                const nsid = ObjectNamespace.getNsid(obj);
                return nsid.startsWith("card.agenda");
            })
            .map((obj) => {
                const nsid = ObjectNamespace.getNsid(obj);
                addedNsids.add(nsid);
                return obj.getCardDetails().name;
            }),
        Relics: objectiveCards
            .filter((obj) => {
                const nsid = ObjectNamespace.getNsid(obj);
                return nsid.startsWith("card.relic");
            })
            .map((obj) => {
                const nsid = ObjectNamespace.getNsid(obj);
                addedNsids.add(nsid);
                return obj.getCardDetails().name;
            }),
    };

    // Add any unclaimed to other objectives.
    data.objectives.Other = objectiveCards
        .filter((obj) => {
            const nsid = ObjectNamespace.getNsid(obj);
            return !addedNsids.has(nsid);
        })
        .map((obj) => {
            const nsid = ObjectNamespace.getNsid(obj);
            addedNsids.add(nsid);
            return obj.getCardDetails().name;
        });

    // Add per-player objectives.
    data.players.forEach((playerData, index) => {
        const playerDesk = playerDesks[index];
        assert(playerDesk);
        const playerSlot = playerDesk.playerSlot;
        const objectives = playerSlotToObjectiveNames[playerSlot];
        if (objectives) {
            playerData.objectives = objectives;
        }
    });

    // Strip off omega suffix.
    for (const [k, v] of Object.entries(data.objectives)) {
        data.objectives[k] = v.map((name) => {
            return name.replace(/ Ω$/, "").replace(/ \(PoK\)$/, "");
        });
    }
    for (const playerData of data.players) {
        if (!playerData.objectives) {
            continue;
        }
        playerData.objectives = playerData.objectives.map((name) => {
            return name.replace(/ Ω$/, "").replace(/ \(PoK\)$/, "");
        });
        playerData.objectives.sort();
    }
};
