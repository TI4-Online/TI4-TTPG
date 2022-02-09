/*
 *    Generic Scripting for Strategy Cards.
 *
 */

const { globalEvents, Rotator, UIElement } = require("../../../wrapper/api");
const { StrategyCardBorder } = require("./strategy-card-border");
const { PlayerDesk } = require("../../player-desk");
const locale = require("../../locale");
let openSelections = {};

function broadcastMessage(message, player) {
    for (const p of world.getAllPlayers()) {
        p.sendChatMessage(message, player && player.getPlayerColor());
    }
}

function onUiClosedClicked(button, player) {
    const border = getTopLevelWidget(button);

    console.warn(border);
    const owningPlayerSlot = border.desk.playerSlot;

    // only react on the correct player
    if (owningPlayerSlot !== player.getSlot()) {
        return;
    }

    // trigger event for the card itself
    globalEvents.TI4.onStrategyCardSelectionDone.trigger(border, player);

    // clear internal data and send notifications
    let selections = openSelections[border.card.getId()];

    world.removeUIElement(border.ui);

    selections.splice(selections.indexOf(owningPlayerSlot), 1);
    if (selections.length === 0) {
        delete openSelections[border.card.getId()];
        broadcastMessage(locale("strategy_card.message.all_resolved"));
    }
}

function getTopLevelWidget(element) {
    const parent = element.getParent();
    return parent ? getTopLevelWidget(parent) : element;
}

function createStrategyCardUi(card, widgetFactory) {
    for (const playerDesk of PlayerDesk.getPlayerDesks()) {
        const cardId = card.getId();
        openSelections[cardId] = openSelections[cardId] || [];
        openSelections[cardId].push(playerDesk.playerSlot);

        let ui = new UIElement();
        let border = new StrategyCardBorder({
            ui: ui,
            desk: playerDesk,
            card: card,
        }).setColor(playerDesk.color);
        border.setChild(widgetFactory());
        border.spawnUi();
    }
}

module.exports = {
    createStrategyCardUi,
    broadcastMessage,
    onUiClosedClicked,
};
