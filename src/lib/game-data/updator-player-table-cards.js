/**
 * CAREFUL, THIS EXPOSES SECRET INFORMATIN (face-down cards on table).
 * NOT INTENDED FOR NORMAL GAME-DATA USE!
 */
const assert = require("../../wrapper/assert-wrapper");
const { CardUtil } = require("../card/card-util");
const { ObjectNamespace } = require("../object-namespace");
const { world } = require("../../wrapper/api");

module.exports = (data) => {
    assert(data.players.length === world.TI4.config.playerCount);
    data.players.forEach((playerData) => {
        playerData.tableCards = [];
    });

    const checkDiscardPile = true;
    const allowFaceDown = true;
    for (const obj of world.getAllObjects()) {
        if (!CardUtil.isLooseCard(obj, checkDiscardPile, allowFaceDown)) {
            continue;
        }

        // Some kinds of cards are recorded elsewhere.
        const nsid = ObjectNamespace.getNsid(obj);
        if (
            nsid.startsWith("card.agenda") ||
            nsid.startsWith("card.faction_reference") ||
            nsid.startsWith("card.faction_token") ||
            nsid.startsWith("card.leader") ||
            nsid.startsWith("card.leader") ||
            nsid.startsWith("card.lgendary_planet") ||
            nsid.startsWith("card.objective") ||
            nsid.startsWith("card.planet") ||
            nsid.startsWith("card.relic") ||
            nsid.startsWith("card.technology")
        ) {
            continue;
        }

        const pos = obj.getPosition();
        const playerDesk = world.TI4.getClosestPlayerDesk(pos);
        if (!playerDesk) {
            continue;
        }

        // Card in a holder owned by player.
        const playerData = data.players[playerDesk.index];
        const name = obj.getCardDetails().name;
        playerData.tableCards.push(name);
    }
};
