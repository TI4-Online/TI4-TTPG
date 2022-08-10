const assert = require("../../../wrapper/assert-wrapper");
const { CommandToken } = require("../../../lib/command-token/command-token");
const { Card, world } = require("../../../wrapper/api");
const { Broadcast } = require("../../../lib/broadcast");
const { ObjectNamespace } = require("../../../lib/object-namespace");
const { Hex } = require("../../../lib/hex");
const locale = require("../../../lib/locale");
const { AbstractRightClickCard } = require("../abstract-right-click-card");

const CARD_NAME = "jace_x_4th_air_legion";
const ACTION_NAME = "*" + locale("ui.menu.helio_command_array");
const PURGE_CONTAINER_NAME = "bag.purge";

/**
 * Remove all command tokens owned by the player who owns this card
 * from the game board.
 */
function helioCommandArray(card) {
    assert(card instanceof Card);
    const cardName = ObjectNamespace.parseCard(card).name;
    assert(cardName === CARD_NAME);

    let cardOwnerSlot = -1;
    for (const desk of world.TI4.getAllPlayerDesks()) {
        const faction = world.TI4.getFactionByPlayerSlot(desk.playerSlot);
        if (faction && faction.raw.leaders.heroes.includes(CARD_NAME)) {
            cardOwnerSlot = desk.playerSlot;
            break;
        }
    }

    if (cardOwnerSlot === -1) {
        Broadcast.broadcastAll(
            locale("ui.message_helio_command_array_has_no_owner")
        );
        return;
    }

    const playerName = world.TI4.getNameByPlayerSlot(cardOwnerSlot);

    Broadcast.broadcastAll(
        locale("ui.message.helio_command_array", { playerName })
    );

    const commandTokens = [];
    for (const obj of world.getAllObjects()) {
        if (obj.getContainer()) {
            continue;
        }
        if (!ObjectNamespace.isCommandToken(obj)) {
            continue;
        }
        if (obj.getOwningPlayerSlot() !== cardOwnerSlot) {
            continue;
        }

        // Get all hexes with a system tile (much cheaper than getSystemTileObjectByPosition).
        const hexSet = new Set();
        for (const systemTileObj of world.TI4.getAllSystemTileObjects()) {
            const pos = systemTileObj.getPosition();
            const hex = Hex.fromPosition(pos);
            hexSet.add(hex);
        }

        const pos = obj.getPosition();
        const hex = Hex.fromPosition(pos);
        if (!hexSet.has(hex)) {
            continue; // not on a system tile
        }
        commandTokens.push(obj);
    }

    const commandTokenBag =
        CommandToken.getPlayerSlotToCommandTokenBag()[cardOwnerSlot];
    commandTokenBag.addObjects(commandTokens, 0, true);

    // purge the card
    let purgeContainer = null;
    for (const obj of world.getAllObjects()) {
        if (obj.getName() === locale(PURGE_CONTAINER_NAME)) {
            purgeContainer = obj;
            break;
        }
    }

    if (purgeContainer) {
        Broadcast.broadcastAll(
            locale("ui.message.purge", { objectName: locale(cardName) })
        );
        purgeContainer.addObjects([card], true);
    }
}

class RightClickHelioCommandArray extends AbstractRightClickCard {
    constructor() {
        super();
    }
    isRightClickable(card) {
        const parsedCard = ObjectNamespace.parseCard(card);
        return parsedCard && parsedCard.name === CARD_NAME;
    }

    getRightClickActionNamesAndTooltips(card) {
        return [{ actionName: ACTION_NAME, tooltip: undefined }];
    }

    onRightClick(card, player, selectedActionName) {
        if (selectedActionName === ACTION_NAME) {
            helioCommandArray(card);
        }
    }
}

new RightClickHelioCommandArray();
