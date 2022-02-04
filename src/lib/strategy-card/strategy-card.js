/*
 *    Generic Scripting for Strategy Cards.
 *
 */

const tp = require("../../wrapper/api");
const locale = require("../../lib/locale");
let items = [];

function broadcastMessage(message, player) {
    for (const p of world.getAllPlayers()) {
        p.sendChatMessage(message, player && player.getPlayerColor());
    }
}

function addCloseButtons(widget, primaryWidget) {
    addCloseButton(widget);
    if (primaryWidget) {
        addCloseButton(primaryWidget);
    }
}

function onCloseButtonClicked(button, closingPlayer) {
    const owningObject = button.getOwningObject();
    if (owningObject.getOwningPlayerSlot() !== closingPlayer.getSlot()) {
        return;
    }

    items.splice(items.indexOf(owningObject));
    globalEvents.TI4.onStrategyCardSelectionDone.trigger(
        owningObject,
        closingPlayer
    );
    owningObject.destroy();

    if (items.length === 0)
        broadcastMessage(locale("strategy_card.message.all_resolved"));
}

function addCloseButton(widget) {
    let closeButton = new tp.Button()
        .setFontSize(10)
        .setText(locale("strategy_card.close.button"));

    closeButton.onClicked.add(onCloseButtonClicked);
    widget.addChild(closeButton);
}

function createStragegyCardUi(widget, primaryWidget, activePlayer) {
    addCloseButtons(widget, primaryWidget);
    let offset = 0;

    for (const p of world.getAllPlayers()) {
        // creating an item to anchor the UI to.
        // one is created for each player and will be destroyed on "close".
        let item = world.createObjectFromTemplate(
            "C5DDE2AC45DD926BFEB81F92B29828A1",
            new Vector(offset, 0, 90.5)
        ); // slightly above a 90cm table
        item.setOwningPlayerSlot(p.getSlot());
        items.push(item);

        offset += 100;
        let ui = new tp.UIElement();
        let border = new tp.Border().setColor(p.getPlayerColor());
        border.setChild(
            primaryWidget && p === activePlayer ? primaryWidget : widget
        );
        ui.useWidgetSize = false;
        ui.widget = border;
        ui.width = 350;
        ui.scale = 0.75;
        ui.position = new Vector(0, 0, 0.15);
        item.addUI(ui);
    }
}
module.exports = {
    createStragegyCardUi,
    broadcastMessage,
};
