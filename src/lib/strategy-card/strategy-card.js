/*
 *    Generic Scripting for Strategy Cards.
 *
 */

const {
    globalEvents,
    Rotator,
    UIElement,
    world,
} = require("../../wrapper/api");
const { StrategyCardBorder } = require("./StrategyCardBorder");
const { PlayerDesk } = require("../../lib/player-desk");
const locale = require("../../lib/locale");
let openSelections = {};

function broadcastMessage(message, player) {
    for (const p of world.getAllPlayers()) {
        p.sendChatMessage(message, player && player.getPlayerColor());
    }
}

function onUiClosedClicked(button, player) {
    const border = getTopLevelWidget(button);

    // only react on the correct player
    if (border.getPlayer() !== player) {
        return;
    }

    // trigger event for the card itself
    globalEvents.TI4.onStrategyCardSelectionDone.trigger(border, player);

    // clear internal data and send notifications
    let selections = openSelections[border.getCard().getId()];

    world.removeUIElement(border.getUI());

    selections.splice(selections.indexOf(border.getPlayer().getSlot()), 1);
    if (selections.length === 0) {
        delete openSelections[border.getCard().getId()];
        broadcastMessage(locale("strategy_card.message.all_resolved"));
    }
}

function getTopLevelWidget(element) {
    const parent = element.getParent();
    return parent ? getTopLevelWidget(parent) : element;
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
        let border = new StrategyCardBorder().setColor(player.getPlayerColor());
        border.setChild(widgetFactory());
        border.setUI(ui);
        border.setPlayer(player);
        border.setCard(card);
        ui.useWidgetSize = false;
        ui.widget = border;
        ui.width = 350;
        ui.scale = 0.75;
        ui.position = matchingDesk.localPositionToWorld({ x: 30, y: 0, z: 10 });
        ui.rotation = matchingDesk.localRotationToWorld(new Rotator(30, 0, 0));
        const i = world.addUI(ui);
    }
}
module.exports = {
    createStrategyCardUi,
    broadcastMessage,
    onUiClosedClicked,
};
