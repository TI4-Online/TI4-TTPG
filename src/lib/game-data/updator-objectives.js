const assert = require("../../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../object-namespace");
const { ObjectSavedData } = require("../saved-data/object-saved-data");
const { world } = require("../../wrapper/api");

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

        // Find control tokens.
        if (ObjectNamespace.isControlToken(obj)) {
            controlTokens.push(obj);
        }

        // Find objective cards.  Can be in a card holder (secrets)!
        const nsid = ObjectNamespace.getNsid(obj);
        if (nsid.startsWith("card.objective.")) {
            objectiveCards.push(obj);
        }

        // Find SFTT cards.
        if (
            nsid.startsWith("card.promissory") &&
            nsid.endsWith("support_for_the_throne")
        ) {
            objectiveCards.push(obj);
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
        const cardHolder = card.getHolder();
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

    // Report all objectives, even those not scored.
    data.objectives = {
        "Public Objectives I": objectiveCards
            .filter((obj) => {
                const nsid = ObjectNamespace.getNsid(obj);
                return nsid.startsWith("card.objective.public_1");
            })
            .map((obj) => {
                return obj.getCardDetails().name;
            }),
        "Public Objectives II": objectiveCards
            .filter((obj) => {
                const nsid = ObjectNamespace.getNsid(obj);
                return nsid.startsWith("card.objective.public_2");
            })
            .map((obj) => {
                return obj.getCardDetails().name;
            }),
        "Secret Objectives": objectiveCards
            .filter((obj) => {
                const nsid = ObjectNamespace.getNsid(obj);
                return nsid.startsWith("card.objective.secret");
            })
            .map((obj) => {
                return obj.getCardDetails().name;
            }),
    };

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
};
