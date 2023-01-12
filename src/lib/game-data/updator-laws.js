const assert = require("../../wrapper/assert-wrapper");
const { CardUtil } = require("../../lib/card/card-util");
const { ObjectNamespace } = require("../object-namespace");
const { world } = require("../../wrapper/api");

module.exports = (data) => {
    const agendaCards = [];
    const controlTokens = [];

    const activeAgendaCard =
        world.TI4.agenda.isActive() && world.TI4.agenda.getAgendaCard();
    const checkDiscardPile = true;
    const allowFaceDown = false;
    for (const obj of world.getAllObjects()) {
        if (obj.getContainer()) {
            continue;
        }

        // Find control tokens.
        if (ObjectNamespace.isControlToken(obj)) {
            controlTokens.push(obj);
        }

        // Agenda (laws in play).
        const nsid = ObjectNamespace.getNsid(obj);
        if (!nsid.startsWith("card.agenda")) {
            continue;
        }
        if (!CardUtil.isLooseCard(obj, checkDiscardPile, allowFaceDown)) {
            continue;
        }
        if (obj === activeAgendaCard) {
            continue;
        }
        agendaCards.push(obj);
    }

    // Report all objectives, even those not scored.
    data.laws = agendaCards.map((obj) => {
        return obj.getCardDetails().name;
    });

    // Report per-player laws.
    const playerDesks = world.TI4.getAllPlayerDesks();
    const playerSlotToLawsNames = {};
    agendaCards.forEach((card) => {
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
                let lawsNames = playerSlotToLawsNames[playerSlot];
                if (!lawsNames) {
                    lawsNames = [];
                    playerSlotToLawsNames[playerSlot] = lawsNames;
                }
                const lawName = card.getCardDetails().name;
                if (!lawsNames.includes(lawName)) {
                    lawsNames.push(lawName);
                }
            });
    });
    data.players.forEach((playerData, index) => {
        const playerDesk = playerDesks[index];
        assert(playerDesk);
        const playerSlot = playerDesk.playerSlot;
        const laws = playerSlotToLawsNames[playerSlot];
        if (laws) {
            playerData.laws = laws;
        } else {
            playerData.laws = []; // overlay requires this if a law is active
        }
    });
};
