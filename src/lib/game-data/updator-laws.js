const assert = require("../../wrapper/assert-wrapper");
const { CardUtil } = require("../../lib/card/card-util");
const { ObjectNamespace } = require("../object-namespace");
const { ObjectSavedData } = require("../saved-data/object-saved-data");
const { Card, world } = require("../../wrapper/api");

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
        if (!(obj instanceof Card)) {
            continue;
        }
        const nsid = ObjectNamespace.getNsid(obj);
        if (!nsid.startsWith("card.agenda")) {
            continue;
        }
        if (obj === activeAgendaCard) {
            continue;
        }

        const isLoose = CardUtil.isLooseCard(
            obj,
            checkDiscardPile,
            allowFaceDown
        );
        const isInScoringHolder =
            obj.isInHolder() && obj.getHolder().getOwningPlayerSlot() < 0;

        if (!isLoose && !isInScoringHolder) {
            continue;
        }
        agendaCards.push(obj);
    }

    // Report all objectives, even those not scored.
    data.laws = agendaCards.map((obj) => {
        return obj.getCardDetails().name;
    });

    // Filter to unique.
    data.laws = data.laws.filter(
        (value, index, self) => self.indexOf(value) === index
    );

    // Assign per-player laws with control tokens on them.
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

    // Assign per-player laws in a player's scoring card holder.
    agendaCards.forEach((card) => {
        if (!card.isInHolder()) {
            return;
        }
        const cardHolder = card.getHolder();
        const deskIndex = ObjectSavedData.get(cardHolder, "deskIndex");
        if (deskIndex === undefined) {
            return;
        }
        const playerDesk = playerDesks[deskIndex];
        if (!playerDesk) {
            return;
        }
        const playerSlot = playerDesk.playerSlot;
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
