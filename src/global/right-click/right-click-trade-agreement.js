const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { Broadcast } = require("../../lib/broadcast");
const {
    Card,
    GameObject,
    globalEvents,
    world,
    Rotator,
} = require("../../wrapper/api");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { Spawn } = require("../../setup/spawn/spawn");
const { CardUtil } = require("../../lib/card/card-util");

function getCommoditiesAndReturnTradeAgreement(card, player) {
    assert(card instanceof Card);

    const parsedCard = ObjectNamespace.parseCard(card);
    const cardColorName = parsedCard.deck.split(".")[1];

    var cardOwnerSlot = -1;
    for (const desk of world.TI4.getAllPlayerDesks()) {
        if (desk.colorName === cardColorName) {
            cardOwnerSlot = desk.playerSlot;
            break;
        }
    }

    if (cardOwnerSlot === -1) {
        Broadcast.broadcastAll(
            locale("ui.message.trade_agreement_has_no_owner")
        );
        return;
    }

    const faction = world.TI4.getFactionByPlayerSlot(cardOwnerSlot);
    if (!faction) {
        Broadcast.broadcastAll(
            locale("ui.message.trade_agreement_has_no_faction")
        );
        return;
    }

    const commodities = faction.raw.commodities;
    const ownerPlayer = world.getPlayerBySlot(cardOwnerSlot);
    let owner = cardColorName;
    if (ownerPlayer) {
        owner = ownerPlayer.getName();
    }

    Broadcast.broadcastAll(
        locale("ui.message.trade_agreement", {
            owner: owner,
            receiver: player.getName(),
            x: commodities,
        })
    );

    // return the trade agreement to it's owners hand
    CardUtil.moveCardsToCardHolder(card, cardOwnerSlot);

    // give commodities to the player holding the trade agreement
    const nsid = "token:base/tradegood_commodity_1";
    let pos = player.getCursorPosition().add([0, 0, 10]);
    let obj;
    for (let i = 0; i < commodities; i++) {
        obj = Spawn.spawn(nsid, pos, new Rotator(0, 0, 0));
        pos = pos.add(obj.getExtent().multiply(2));
    }
}

function maybeTradeAgreement(card, player, selectedActionName) {
    const actionName = "*" + locale("ui.menu.trade_agreement");
    if (selectedActionName === actionName) {
        getCommoditiesAndReturnTradeAgreement(card, player);
    }
}

function addRightClickOption(card) {
    assert(card instanceof Card);
    removeRightClickOption(card);
    const actionName = "*" + locale("ui.menu.trade_agreement");
    card.addCustomAction(actionName);
    card.onCustomAction.add(maybeTradeAgreement);
}

function removeRightClickOption(card) {
    const actionName = "*" + locale("ui.menu.purge");
    card.removeCustomAction(actionName);
    card.onCustomAction.remove(maybeTradeAgreement);
}

function isTradeAgreement(obj) {
    assert(obj instanceof GameObject);

    if (!(obj instanceof Card)) {
        return false;
    }

    if (!ObjectNamespace.isCard(obj)) {
        return false;
    }

    const parsedCard = ObjectNamespace.parseCard(obj);
    const name = parsedCard.name;

    if (name.startsWith("trade_agreement")) {
        return true;
    }
}

globalEvents.TI4.onSingletonCardCreated.add((obj) => {
    if (isTradeAgreement(obj)) {
        addRightClickOption(obj);
        obj.__hasRightClickTradeAgreement = true;
    }
});

globalEvents.TI4.onSingletonCardMadeDeck.add((obj) => {
    if (obj.__hasRightClickTradeAgreement) {
        removeRightClickOption(obj);
        delete obj.__hasRightClickTradeAgreement;
    }
});

for (const obj of world.getAllObjects()) {
    if (isTradeAgreement(obj)) {
        addRightClickOption(obj);
        obj.__hasRightClickTradeAgreement = true;
    }
}
