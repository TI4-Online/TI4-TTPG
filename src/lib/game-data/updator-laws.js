const { CardUtil } = require("../../lib/card/card-util");
const { world } = require("../../wrapper/api");
const { ObjectNamespace } = require("../object-namespace");
module.exports = (data) => {
    const agendaCards = [];

    const checkDiscardPile = true;
    const allowFaceDown = false;
    for (const obj of world.getAllObjects()) {
        const nsid = ObjectNamespace.getNsid(obj);
        if (!nsid.startsWith("card.agenda")) {
            continue;
        }
        // Agenda (laws in play).
        if (!CardUtil.isLooseCard(obj, checkDiscardPile, allowFaceDown)) {
            continue;
        }
        agendaCards.push(obj);
    }

    // Report all objectives, even those not scored.
    data.laws = agendaCards.map((obj) => {
        return obj.getCardDetails().name;
    });
};
