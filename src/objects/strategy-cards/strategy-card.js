/*
 *    Generic Scripting for Strategy Cards.
 *
 */

const assert = require("../../wrapper/assert-wrapper");
const {
    GameObject,
    UIElement,
    globalEvents,
    world,
} = require("../../wrapper/api");
const { StrategyCardBorder } = require("./strategy-card-border");
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

function createStrategyCardUi(card, widgetFactory, height, width, color) {
    const cardId = card.getId();

    // clear existing UIs from the card instance
    if (openSelections[cardId]) {
        openSelections[cardId].forEach((border) => {
            world.removeUIElement(border.ui);
        });
    }
    
    openSelections[cardId] = [];

    for (const playerDesk of world.TI4.getAllPlayerDesks()) {
        let ui = new UIElement();
        let border = new StrategyCardBorder({
            card: card,
            desk: playerDesk,
            height: typeof height === "function"
                ? height(playerDesk.playerSlot)
                : height,
            width: typeof width === "function"
                ? height(playerDesk.playerSlot)
                : width,
            ui: ui,
        }).setColor(color);
        border.setChild(widgetFactory(playerDesk));
        border.spawnUi();

        openSelections[cardId].push(border);
    }
}

/**
 * Builder class for registering a new strategy card object by adding event
 * handlers as well as their removal in case of the destruction of the object.
 */
class RegisterStrategyCardUI {
    /**
     *
     * @param {object} [data]
     * @param {GameObject} [data.card] The object instance of the strategy card
     * @param {function} [data.widgetFactory] A factory creating the UI for each player
     * @param {Integer | function} [data.height] Height of the UI for each player. Can also be provided as a function
     * to determine the height dynamically on UI creation
     * @param {Integer | function} [data.width] Width of the UI for each player. Can also be provided as a function
     * to determine the height dynamically on UI creation
     * @param {Color} [data.color] Color of the UI for each player
     * @param {function} [data.onStrategyCardPlayed] Event handler of the "Play" button pressed.
     * This function only is required if the Play button should do more than just creating a UI.
     * The whole UI creation should belong into the widgetFactory to separate concerns.
     * @param {function} [data.onStrategyCardSelectionDone] Event handler for the closing event.
     */
    constructor(data) {
        this._card = data && data.card;
        this._widgetFactory = data && data.widgetFactory;
        this._height = data && data.height;
        this._width = (data && data.width) || 350;
        this._color = data && data.color;
        this._onStrategyCardPlayed = data && data.onStrategyCardPlayed;
        this._onStrategyCardSelectionDone =
            data && data.onStrategyCardSelectionDone;
    }

    setCard(value) {
        this._card = value;
        return this;
    }

    setWidgetFactory(value) {
        this._widgetFactory = value;
        return this;
    }

    setHeight(value) {
        this._height = value;
        return this;
    }

    setWidth(value) {
        this._width = value;
        return this;
    }

    setColor(value) {
        this._color = value;
        return this;
    }

    setOnStrategyCardPlayed(value) {
        this._onStrategyCardPlayed = value;
        return this;
    }

    setOnStrategyCardSelectionDone(value) {
        this._onStrategyCardSelectionDone = value;
        return this;
    }

    /**
     * Actual registration of the strategy card UI creation.
     * At this point it is mandatory that <code>object</code>, <code>widgetFactory</code> and
     * <code>height</code> are set.
     */
    register() {
        // only on registration is allowed at this time
        assert(!this._registered);

        // the refObject is undefined in a test environment
        if (world.__isMock) {
            this._card = this._card || new GameObject();
        }

        assert(this._card instanceof GameObject);
        assert(typeof this._widgetFactory === "function");
        assert(
            Number.isInteger(this._height) || typeof this._height === "function"
        );
        assert(
            Number.isInteger(this._width) || typeof this._width === "function"
        );
        assert(
            this._onStrategyCardPlayed === undefined ||
                typeof this._onStrategyCardPlayed === "function"
        );
        assert(
            this._onStrategyCardSelectionDone === undefined ||
                typeof this._onStrategyCardSelectionDone === "function"
        );

        const onStrategyCardPlayedGlobalEventHandler = (card, player) => {
            // strategy card tests have a mocked object not matching the card
            if (this._card !== card && !world.__isMock) return;
            createStrategyCardUi(
                this._card,
                this._widgetFactory,
                this._height,
                this._width,
                this._color
            );
            if (!this._onStrategyCardPlayed) return;
            this._onStrategyCardPlayed(this._card, player);
        };

        globalEvents.TI4.onStrategyCardPlayed.add(
            onStrategyCardPlayedGlobalEventHandler
        );

        this._card.onDestroyed.add(() => {
            globalEvents.TI4.onStrategyCardPlayed.remove(
                onStrategyCardPlayedGlobalEventHandler
            );
        });

        if (this._onStrategyCardSelectionDone) {
            const onStrategyCardSelectionDoneGlobalEventHandler = (
                card,
                player
            ) => {
                // strategy card tests have a mocked object not matching the card
                if (this._card !== card && !world.__isMock) return;
                this._onStrategyCardSelectionDone(this._card, player);
            };

            globalEvents.TI4.onStrategyCardSelectionDone.add(
                onStrategyCardSelectionDoneGlobalEventHandler
            );
            this._card.onDestroyed.add((obj) => {
                globalEvents.TI4.onStrategyCardSelectionDone.remove(
                    onStrategyCardSelectionDoneGlobalEventHandler
                );
            });
        }

        this._registered = true;
        return this;
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
    RegisterStrategyCardUI,
};
