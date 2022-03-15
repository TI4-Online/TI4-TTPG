const assert = require("../../wrapper/assert-wrapper");
const { CardUtil } = require("../../lib/card/card-util");
const { ObjectNamespace } = require("../object-namespace");
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

        // Find objective cards.
        const nsid = ObjectNamespace.getNsid(obj);
        const checkDiscardPile = false;
        const allowFaceDown = false;
        if (
            nsid.startsWith("card.objective.") &&
            CardUtil.isLooseCard(obj, checkDiscardPile, allowFaceDown)
        ) {
            objectiveCards.push(obj);
        }
    }

    const playerSlotToObjectiveNames = {};
    objectiveCards.forEach((card) => {
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
    const playerDesks = world.TI4.getAllPlayerDesks();
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
