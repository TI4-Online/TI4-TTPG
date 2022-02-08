/*
 *    Generic Scripting for Strategy Cards.
 *
 */

const {
    globalEvents,
    Border,
    Rotator,
    UIElement
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
    const widget = getTopLevelWidget(button);
    const uiData = widget.TI4;

    // only react on the correct player
    if (uiData.owningPlayer !== player.getSlot()) {
        return;
    }

    // trigger event for the card itself
    globalEvents.TI4.onStrategyCardSelectionDone.trigger(widget, player);

    // clear internal data and send notifications
    let selections = openSelections[uiData.relatedCard.getId()];

    world.removeUI(uiData.ui);

    selections.splice(selections.indexOf(uiData.owningPlayer), 1);
    if (selections.length === 0) {
        delete openSelections[uiData.relatedCard.getId()];
        broadcastMessage(locale("strategy_card.message.all_resolved"));
    }
}

function getTopLevelWidget(element) {
    const parent = element.getParent();
    if (!parent) {
        return element;
    }
    return getTopLevelWidget(parent);
}

function createStrategyCardUi(card, widgetFactory) {
    const playerDesks = PlayerDesk.getPlayerDesks();

    for (const player of world.getAllPlayers()) {
        const matchingDesk = playerDesks.find(
            (desk) => desk._playerSlot === player.getSlot()
        );

        if (!matchingDesk) {
            continue; // unseated player
        }

        const cardId = card.getId();
        let ui = new UIElement();
        openSelections[cardId] = openSelections[cardId] || [];
        openSelections[cardId].push(player.getSlot());
        let border = new Border().setColor(player.getPlayerColor());
        border.setChild(widgetFactory());
        border.TI4 = {
            ui: ui,
            relatedCard: card,
            owningPlayer: player.getSlot()
        };
        ui.useWidgetSize = false;
        ui.widget = border;
        ui.width = 350;
        ui.scale = 0.75;
        ui.position = matchingDesk.localPositionToWorld({ x: 30, y: 0, z: 10 });
        ui.rotation = matchingDesk.localRotationToWorld(new Rotator(30, 0, 0));
        world.addUI(ui);
    }
}
module.exports = {
    createStrategyCardUi,
    broadcastMessage,
    onUiClosedClicked,
};
