/*
 *    Generic Scripting for Strategy Cards.
 *
 */

const {
    globalEvents,
    Border,
    Rotator,
    UIElement,
    Vector,
} = require("../../wrapper/api");
const { PlayerDesk } = require("../../lib/player-desk");
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

    // trigger event for the card itself
    globalEvents.TI4.onStrategyCardSelectionDone.trigger(owningObject, player);

    // clear internal data and send notifications
    let selections = openSelections[owningObject.TI4.relatedCard.getId()];
    selections.splice(selections.indexOf(player.getSlot()), 1);
    if (selections.length === 0) {
        delete openSelections[owningObject.getId()];
        broadcastMessage(locale("strategy_card.message.all_resolved"));
    }

    owningObject.destroy();
}

function createStrategyCardUi(card, widget) {
    let offset = 0;
    const playerDesks = PlayerDesk.getPlayerDesks();

    for (const player of world.getAllPlayers()) {
        const matchingDesk = playerDesks.find(
            (desk) => desk._playerSlot === player.getSlot()
        );

        // creating an item to anchor the UI to.
        // one is created for each player and will be destroyed on "close".
        let item = world.createObjectFromTemplate(
            "C5DDE2AC45DD926BFEB81F92B29828A1",
            matchingDesk.localPositionToWorld({ x: 30, y: 0, z: 0 })
        ); // slightly above a 90cm table
        item.setOwningPlayerSlot(player.getSlot());
        const cardId = card.getId();
        openSelections[cardId] = openSelections[cardId] || [];
        openSelections[cardId].push(player.getSlot());
        item.TI4 = {
            relatedCard: card,
        };
        offset += 100;
        let ui = new UIElement();
        let border = new Border().setColor(player.getPlayerColor());
        border.setChild(widget);
        ui.useWidgetSize = false;
        ui.widget = border;
        ui.width = 350;
        ui.scale = 0.75;
        ui.position = new Vector(0, 0, world.getTableHeight() + 10);
        ui.rotation = matchingDesk.localRotationToWorld(new Rotator(30, 0, 0));
        item.addUI(ui);
    }
}
module.exports = {
    createStrategyCardUi,
    broadcastMessage,
    onUiClosedClicked,
};
