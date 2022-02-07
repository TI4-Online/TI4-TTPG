/*
 *    Generic Scripting for Strategy Cards.
 *
 */

const { globalEvents, Border, UIElement, Vector } = require("../../wrapper/api");
const locale = require("../../lib/locale");
let openSelections = {};

function broadcastMessage(message, player) {
    for (const p of world.getAllPlayers()) {
        p.sendChatMessage(message, player && player.getPlayerColor());
    }
}

function onUiClosedClicked(button, player) {
    const owningObject = button.getOwningObject();

    // only react on the correct player
    if (owningObject.getOwningPlayerSlot() !== player.getSlot()) {
        return;
    }

    // clear internal data and send notifications
    let selections = openSelections[owningObject.TI4.relatedCard.getId()];
    selections.splice(selections.indexOf(player.getSlot()), 1);
    if (selections.length === 0) {
        delete openSelections[owningObject.getId()];
        broadcastMessage(locale("strategy_card.message.all_resolved"));
    }

    // trigger event for the card itself
    globalEvents.TI4.onStrategyCardSelectionDone.trigger(
        owningObject,
        player
    );
    owningObject.destroy();
}

function createStrategyCardUi(card, widget) {
    let offset = 0;

    for (const player of world.getAllPlayers()) {
        // creating an item to anchor the UI to.
        // one is created for each player and will be destroyed on "close".
        let item = world.createObjectFromTemplate(
            "C5DDE2AC45DD926BFEB81F92B29828A1",
            new Vector(offset, 0, 90.5)
        ); // slightly above a 90cm table
        item.setOwningPlayerSlot(player.getSlot());
        const cardId = card.getId();
        openSelections[cardId] = openSelections[cardId] || [];
        openSelections[cardId].push(player.getSlot());
        item.TI4 = {
            relatedCard: card
        };
        offset += 100;
        let ui = new UIElement();
        let border = new Border().setColor(player.getPlayerColor());
        border.setChild(widget);
        ui.useWidgetSize = false;
        ui.widget = border;
        ui.width = 350;
        ui.scale = 0.75;
        ui.position = new Vector(0, 0, 0.15);
        item.addUI(ui);
    }
}
module.exports = {
    createStrategyCardUi,
    broadcastMessage,
    onUiClosedClicked,
};
