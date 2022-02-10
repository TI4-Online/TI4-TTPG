/*
 *    Generic Scripting for Strategy Cards.
 *
 */

const assert = require("../../wrapper/assert-wrapper");
const { globalEvents, GameObject, UIElement } = require("../../wrapper/api");
const { StrategyCardBorder } = require("./strategy-card-border");
const { PlayerDesk } = require("../../lib/player-desk");
const locale = require("../../lib/locale");
let openSelections = {};

function broadcastMessage(messageKey, localeArgs = {}, player) {
    const message = locale(messageKey, localeArgs);
    for (const p of world.getAllPlayers()) {
        p.sendChatMessage(message, player && player.getPlayerColor());
    }
}

function getTopLevelWidget(element) {
    const parent = element.getParent();
    return parent ? getTopLevelWidget(parent) : element;
}

/**
 * Registers a new strategy card object by adding event handlers as well as
 * their removal in case of the destruction of the object.
 * The play card is mandatory while the
 *
 * @param refObject The object instance of the strategy card
 * @param widgetFactory A factory creating the UI for each player
 * @param [onStrategyCardPlayed] Event handler of the "Play" button pressed.
 * This function only is required if the Play button should do more than just creating a UI.
 * The whole UI creation should belong into the widgetFactory to separate concerns.
 * @param [onStrategyCardSelectionDone] Event handler for the close
 */
function registerStrategyCard(
    refObject,
    widgetFactory,
    height,
    onStrategyCardPlayed,
    onStrategyCardSelectionDone
) {
    // the refObject is undefined in a test environment
    let object =
        refObject === undefined && world.__isMock
            ? new GameObject()
            : refObject;

    assert(object instanceof GameObject);
    assert(typeof widgetFactory === "function");
    assert(Number.isInteger(height));
    assert(
        onStrategyCardPlayed === undefined ||
            typeof onStrategyCardSelectionDone === "function"
    );
    assert(
        onStrategyCardSelectionDone === undefined ||
            typeof onStrategyCardSelectionDone === "function"
    );

    const onStrategyCardPlayedGlobalEventHandler = (card, player) => {
        // strategy card tests have a mocked object not matching the card
        if (object !== card && !world.__isMock) return;
        createStrategyCardUi(card, widgetFactory, height);
        if (!onStrategyCardPlayed) return;
        onStrategyCardPlayed(card, player);
    };

    globalEvents.TI4.onStrategyCardPlayed.add(
        onStrategyCardPlayedGlobalEventHandler
    );

    object.onDestroyed.add(() => {
        globalEvents.TI4.onStrategyCardPlayed.remove(
            onStrategyCardPlayedGlobalEventHandler
        );
    });

    if (onStrategyCardSelectionDone) {
        const onStrategyCardSelectionDoneGlobalEventHandler = (
            card,
            player
        ) => {
            // strategy card tests have a mocked object not matching the card
            if (object !== card && !world.__isMock) return;
            onStrategyCardSelectionDone(card, player);
        };

        globalEvents.TI4.onStrategyCardSelectionDone.add(
            onStrategyCardSelectionDoneGlobalEventHandler
        );
        object.onDestroyed.add((obj) => {
            globalEvents.TI4.onStrategyCardSelectionDone.remove(
                onStrategyCardSelectionDoneGlobalEventHandler
            );
        });
    }
}

function createStrategyCardUi(card, widgetFactory, height) {
    const cardId = card.getId();

    // clear existing UIs from the card instance
    if (openSelections[cardId]) {
        for (let border in openSelections[cardId]) {
            world.removeUIElement(border.ui);
        }
    }

    openSelections[cardId] = [];

    for (const playerDesk of PlayerDesk.getPlayerDesks()) {
        let ui = new UIElement();
        let border = new StrategyCardBorder({
            card: card,
            desk: playerDesk,
            height: height,
            ui: ui,
        }).setColor(playerDesk.color);
        border.setChild(widgetFactory());
        border.spawnUi();

        openSelections[cardId].push(border);
    }
}

function onUiClosedClicked(button, player) {
    const border = getTopLevelWidget(button);
    const owningPlayerSlot = border.desk.playerSlot;

    // only react on the correct player
    if (owningPlayerSlot !== player.getSlot()) {
        return;
    }

    // trigger event for the card itself
    globalEvents.TI4.onStrategyCardSelectionDone.trigger(border.card, player);

    // clear internal data and remove the UI
    let selections = openSelections[border.card.getId()];
    world.removeUIElement(border.ui);
    selections.splice(selections.indexOf(border), 1);

    // send notifications in case all have responded
    if (selections.length === 0) {
        delete openSelections[border.card.getId()];
        broadcastMessage(locale("strategy_card.message.all_resolved"));
    }
}

module.exports = {
    broadcastMessage,
    onUiClosedClicked,
    registerStrategyCard,
};
