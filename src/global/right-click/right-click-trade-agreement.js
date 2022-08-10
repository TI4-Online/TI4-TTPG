const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { Broadcast } = require("../../lib/broadcast");
const { Card, world, Rotator } = require("../../wrapper/api");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { Spawn } = require("../../setup/spawn/spawn");
const { CardUtil } = require("../../lib/card/card-util");
const { AbstractRightClickCard } = require("./abstract-right-click-card");

const ACTION_NAME = "*" + locale("ui.menu.trade_agreement");

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

class RightClickTradeAgreement extends AbstractRightClickCard {
    constructor() {
        super();
    }

    isRightClickable(card) {
        const parsedCard = ObjectNamespace.parseCard(card);
        const name = parsedCard?.name;
        return name && name.startsWith("trade_agreement");
    }

    /**
     * Get the array of right click action names.
     *
     * @param {Card} card
     * @returns {Array.{Object{actionName:string, tooltip:string}}} Right click actions
     */
    getRightClickActionNamesAndTooltips(card) {
        return [{ actionName: ACTION_NAME, tooltip: undefined }];
    }

    /**
     * Handle a right click action.
     *
     * @param {Card} card
     * @param {Player} player
     * @param {string} selectedActionName
     */
    onRightClick(card, player, selectedActionName) {
        if (selectedActionName === ACTION_NAME) {
            getCommoditiesAndReturnTradeAgreement(card, player);
        }
    }
}

new RightClickTradeAgreement();
