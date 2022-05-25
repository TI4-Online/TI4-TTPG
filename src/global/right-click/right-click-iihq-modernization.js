const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { CardUtil } = require("../../lib/card/card-util");
const { Card, GameObject, globalEvents, world } = require("../../wrapper/api");

const LEGENDARY_NSID = "card.legendary_planet:codex.vigil/custodia_vigilia";
const PLANET_NSID = "card.planet:codex.vigil/custodia_vigilia";

function fetchCustodiaVigilia(player) {
    var pos = player.getCursorPosition().add([0, 0, 5]);
    const planetCard = CardUtil.gatherCards((nsid, _cardOrDeck) => {
        return nsid === PLANET_NSID;
    })[0];
    planetCard.setPosition(pos);

    // planet is gained exhausted, ensure the card comes face down
    const planetCardRot = planetCard.getRotation();
    if (planetCard.isFaceUp()) {
        planetCard.setRotation(planetCardRot.compose([0, 0, 180]));
    }

    const legendaryCard = CardUtil.gatherCards((nsid, _cardOrDeck) => {
        return nsid === LEGENDARY_NSID;
    })[0];
    legendaryCard.setPosition(pos.add([1, 1, 5]));

    // legendary card is not exhaustable, ensure it comes face up
    const legendaryCardRot = legendaryCard.getRotation();
    if (!legendaryCard.isFaceUp()) {
        legendaryCard.setRotation(legendaryCardRot.compose([0, 0, 180]));
    }
}

function maybeFetchCustodiaVigilia(_card, player, selectedActionName) {
    const actionName = "*" + locale("ui.menu.fetch_custodia_vigilia");
    if (selectedActionName === actionName) {
        fetchCustodiaVigilia(player);
    }
}

function addRightClickOption(card) {
    assert(card instanceof Card);
    removeRightClickOption(card);
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
