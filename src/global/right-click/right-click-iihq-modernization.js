const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { CardUtil } = require("../../lib/card/card-util");
const { Card, GameObject, globalEvents, world } = require("../../wrapper/api");

const LEGENDARY_NSID = "card.legendary_planet:codex.vigil/custodia_vigilia";
const PLANET_NSID = "card.planet:codex.vigil/custodia_vigilia";

function fetchCustodiaVigilia(player) {
    var pos = player.getCursorPosition().add([0, 0, 5]);
    const cards = CardUtil.gatherCards((nsid, _cardOrDeck) => {
        return nsid === PLANET_NSID || nsid === LEGENDARY_NSID;
    });
    cards.forEach((card) => {
        card.setPosition(pos);
        pos = pos.add([2, 2, 0]);
    });
}

function maybeFetchCustodiaVigilia(_card, player, selectedActionName) {
    const actionName = "*" + locale("ui.menu.fetch_custodia_vigilia");
    if (selectedActionName === actionName) {
        fetchCustodiaVigilia(player);
    }
}

function addRightClickOption(card) {
    assert(card instanceof Card);
    const actionName = "*" + locale("ui.menu.fetch_custodia_vigilia");
    card.addCustomAction(actionName);
    card.onCustomAction.add(maybeFetchCustodiaVigilia);
}

function removeRightClickOption(card) {
    const actionName = "*" + locale("ui.menu.fetch_custodia_vigilia");
    card.removeCustomAction(actionName);
    card.onCustomAction.remove(maybeFetchCustodiaVigilia);
}

function isIIHQModernization(obj) {
    assert(obj instanceof GameObject);

    if (!(obj instanceof Card)) {
        return false;
    }

    if (!ObjectNamespace.isCard(obj)) {
        return false;
    }

    const parsedCard = ObjectNamespace.parseCard(obj);
    const name = parsedCard.name;

    if (name.startsWith("iihq_modernization")) {
        return true;
    }
}

globalEvents.TI4.onSingletonCardCreated.add((obj) => {
    if (isIIHQModernization(obj)) {
        addRightClickOption(obj);
        obj.__hasRightClickFetchCustodiaVigilia = true;
    }
});

globalEvents.TI4.onSingletonCardMadeDeck.add((obj) => {
    if (obj.__hasRightClickFetchCustodiaVigilia) {
        removeRightClickOption(obj);
        delete obj.__hasRightClickFetchCustodiaVigilia;
    }
});

for (const obj of world.getAllObjects()) {
    if (isIIHQModernization(obj)) {
        addRightClickOption(obj);
        obj.__hasRightClickFetchCustodiaVigilia = true;
    }
}
