const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const CONFIG = require("../../game-ui/game-ui-config");
const { Broadcast } = require("../../lib/broadcast");
const { ColorUtil } = require("../../lib/color/color-util");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { ThrottleClickHandler } = require("../../lib/ui/throttle-click-handler");
const {
    Border,
    Button,
    Color,
    GameObject,
    LayoutBox,
    Rotator,
    Text,
    UIElement,
    Vector,
    VerticalBox,
    Widget,
    globalEvents,
    refPackageId,
    world,
} = require("../../wrapper/api");

// If a new strategy card is played while a player still has one open,
// position the new UI behind the other(s).
const _playerSlotToActiveAbstractStrategyCards = {};

const SCALE = 2;
const FONT_SIZE_PLAY_BUTTON = 9 * SCALE;
const FONT_SIZE_TITLE = 14 * SCALE;
const FONT_SIZE_BODY = 10 * SCALE;
const SPACING = 2 * SCALE;

/**
 * Manage strategy card UI.
 *
 * UI always has a title with the card name, and a "close" button at bottom.
 *
 * The default body is "primary", "secondary", and "pass".  Strategy cards can
 * override body content using `setBodyWidgetFactory`, passing in a function
 * taking (verticalBox, playerDesk) arguments.
 *
 * In order to avoid confuction and let players use any automator buttons,
 * only the close button closes the window.  (That is, a player may select
 * "secondary" but needs to click close.  If the window closes and they
 * intended to use any autormator help they would have had to have done
 * it first.  The explicit "close" makes it clear.)
 */
class AbstractStrategyCard {
    static getStrategyCardName(gameObject) {
        assert(gameObject instanceof GameObject);
        assert(ObjectNamespace.isStrategyCard(gameObject));

        const parsed = ObjectNamespace.parseStrategyCard(gameObject);
        return parsed ? locale(`tile.strategy.${parsed.card}`) : "?";
    }

    /**
     * Add "play" button and context menu item to a strategy card.
     *
     * Play triggers the globalEvents.TI4.onStrategyCardPlayed event.
     *
     * @param {GameObject} strategyCardObj - strategy card
     */
    static addPlayButton(strategyCardObj) {
        assert(strategyCardObj instanceof GameObject);
        assert(ObjectNamespace.isStrategyCard(strategyCardObj));

        const cardName =
            AbstractStrategyCard.getStrategyCardName(strategyCardObj);
        const playButtonName = locale("ui.button.strategy_card_play");
        const playButtonTooltip = locale("ui.tooltip.strategy_card_play");

        const handleOnPlayButtonClicked = (button, player) => {
            // Report.
            const playerName = world.TI4.getNameByPlayerSlot(player.getSlot());
            const msg = locale("ui.message.strategy_card_play", {
                playerName,
                cardName,
            });
            Broadcast.broadcastAll(msg);

            // Tell any listeners.
            globalEvents.TI4.onStrategyCardPlayed.trigger(
                strategyCardObj,
                player
            );
        };

        // Setup the play button
        const playButton = new Button()
            .setFontSize(FONT_SIZE_PLAY_BUTTON)
            .setText(playButtonName);
        playButton.onClicked.add(
            ThrottleClickHandler.wrap(handleOnPlayButtonClicked)
        );
        const ui = new UIElement();
        ui.position = new Vector(3, -0.5, -0.16 - CONFIG.buttonLift);
        ui.rotation = new Rotator(180, 180, 0); // THis makes it appear ont he back side only.
        ui.scale = 1 / SCALE;
        ui.widget = playButton;
        strategyCardObj.addUI(ui);

        // Also add as a context menu item.
        const playActionName = "*" + playButtonName;
        strategyCardObj.addCustomAction(playActionName, playButtonTooltip);
        strategyCardObj.onCustomAction.add((obj, player, actionName) => {
            if (actionName === playActionName) {
                handleOnPlayButtonClicked(playButton, player);
            }
        });
    }

    /**
     * Set up globalEvents.TI4.onStrategyCardMovementStopped triggering when
     * the game object stops moving (e.g. selected by a player, flipped, etc).
     *
     * @param {GameObject} strategyCardObj - strategy card
     */
    static addOnMovementStoppedTrigger(strategyCardObj) {
        assert(strategyCardObj instanceof GameObject);
        assert(ObjectNamespace.isStrategyCard(strategyCardObj));

        // TTPG can keep sending this event (physics?), suppress if not changed much.
        let lastLossy = "";
        strategyCardObj.onMovementStopped.add((obj) => {
            const pos = obj.getPosition();
            const rot = obj.getRotation();
            const lossy = [
                Math.round(pos.x),
                Math.round(pos.y),
                Math.round(pos.z),
                Math.round(rot.pitch),
                Math.round(rot.yaw),
                Math.round(rot.roll),
            ].join(",");
            if (lossy === lastLossy) {
                return;
            }
            lastLossy = lossy;

            globalEvents.TI4.onStrategyCardMovementStopped.trigger(obj);
        });
    }

    /**
     * Create the "primary" button, not added to any parent.
     *
     * @param {PlayerDesk} playerDesk
     * @param {GameObject} strategyCardObj
     * @returns {Button}
     */
    static createButtonPlayPrimary(playerDesk, strategyCardObj) {
        assert(playerDesk);
        assert(strategyCardObj instanceof GameObject);
        assert(ObjectNamespace.isStrategyCard(strategyCardObj));

        const playerSlot = playerDesk.playerSlot;
        const playerName = world.TI4.getNameByPlayerSlot(playerSlot);
        const msgColor = playerDesk.color;
        const cardName =
            AbstractStrategyCard.getStrategyCardName(strategyCardObj);

        const onPrimaryClicked = (button, player) => {
            Broadcast.chatAll(
                locale(`strategy_card.base.message.primary`, {
                    playerName,
                    cardName,
                }),
                msgColor
            );
        };
        const primaryButton = new Button()
            .setFontSize(FONT_SIZE_BODY)
            .setText(locale("strategy_card.base.button.primary"));
        primaryButton.onClicked.add(
            ThrottleClickHandler.wrap(onPrimaryClicked)
        );
        return primaryButton;
    }

    /**
     * Create the "primary" button, not added to any parent.
     *
     * @param {PlayerDesk} playerDesk
     * @param {GameObject} strategyCardObj
     * @returns {Button}
     */
    static createButtonPlaySecondary(playerDesk, strategyCardObj) {
        assert(playerDesk);
        assert(strategyCardObj instanceof GameObject);
        assert(ObjectNamespace.isStrategyCard(strategyCardObj));

        const playerSlot = playerDesk.playerSlot;
        const playerName = world.TI4.getNameByPlayerSlot(playerSlot);
        const msgColor = playerDesk.color;
        const cardName =
            AbstractStrategyCard.getStrategyCardName(strategyCardObj);

        const onSecondaryClicked = (button, player) => {
            Broadcast.chatAll(
                locale(`strategy_card.base.message.secondary`, {
                    playerName,
                    cardName,
                }),
                msgColor
            );
        };
        const secondaryButton = new Button()
            .setFontSize(FONT_SIZE_BODY)
            .setText(locale("strategy_card.base.button.secondary"));
        secondaryButton.onClicked.add(
            ThrottleClickHandler.wrap(onSecondaryClicked)
        );
        return secondaryButton;
    }

    /**
     * Create the "pass" button, not added to any parent.
     *
     * @param {PlayerDesk} playerDesk
     * @param {GameObject} strategyCardObj
     * @returns {Button}
     */
    static createButtonPlayPass(playerDesk, strategyCardObj) {
        assert(playerDesk);
        assert(strategyCardObj instanceof GameObject);
        assert(ObjectNamespace.isStrategyCard(strategyCardObj));

        const playerSlot = playerDesk.playerSlot;
        const playerName = world.TI4.getNameByPlayerSlot(playerSlot);
        const msgColor = playerDesk.color;
        const cardName =
            AbstractStrategyCard.getStrategyCardName(strategyCardObj);

        const onPassClicked = (button, player) => {
            Broadcast.chatAll(
                locale(`strategy_card.base.message.pass`, {
                    playerName,
                    cardName,
                }),
                msgColor
            );
        };
        const passButton = new Button()
            .setFontSize(FONT_SIZE_BODY)
            .setText(locale("strategy_card.base.button.pass"));
        passButton.onClicked.add(ThrottleClickHandler.wrap(onPassClicked));
        return passButton;
    }

    constructor(gameObject) {
        assert(gameObject instanceof GameObject);
        assert(ObjectNamespace.isStrategyCard(gameObject));

        this._gameObject = gameObject;
        this._color = new Color(1, 1, 1);
        this._bodyWidgetFactory = (playerDesk, strategyCardObj) => {
            assert(playerDesk);
            assert(strategyCardObj instanceof GameObject);
            return this._defaultBodyWidgetFactory(playerDesk, strategyCardObj);
        };
        this._automatorButtons = undefined;
        this._playerSlotToUi = {};
        this._playerSlotToPlayed = {};

        // Clicking the play button shows UI.  Do not link directly to the
        // button, instead listen for the event.
        const playListener = (obj, player) => {
            if (obj === gameObject) {
                for (const playerDesk of world.TI4.getAllPlayerDesks()) {
                    this._addUI(playerDesk);
                }
            }
        };
        globalEvents.TI4.onStrategyCardPlayed.add(playListener);
        gameObject.onDestroyed.add(() => {
            globalEvents.TI4.onStrategyCardPlayed.remove(playListener);
        });

        AbstractStrategyCard.addPlayButton(gameObject);
        AbstractStrategyCard.addOnMovementStoppedTrigger(gameObject);
    }

    /**
     * Set window color.
     *
     * @param {Color} color
     * @returns {AbstractStrategyCard} self, for chaining
     */
    setColor(color) {
        assert(ColorUtil.isColor(color));
        this._color = color;
        return this;
    }

    /**
     * Fill the VerticalBox between the header and footer.
     *
     * @param {function} bodyWidgetFactory
     * @returns {AbstractStrategyCard} self, for chaining
     */
    setBodyWidgetFactory(bodyWidgetFactory) {
        assert(typeof bodyWidgetFactory === "function");
        this._bodyWidgetFactory = bodyWidgetFactory;
        return this;
    }

    /**
     * Add a strategy card automator button.
     *
     * @param {string} actionName
     * @param {function} handler - (gameObject, player, actionName)
     * @returns {AbstractStrategyCard} self, for chaining
     */
    addAutomatorButton(actionName, handler) {
        assert(typeof actionName === "string");
        assert(typeof handler === "function");
        if (!this._automatorButtons) {
            this._automatorButtons = [];
        }
        this._automatorButtons.push({ actionName, handler });
        return this;
    }

    /**
     * Strategy card popups stack behind current ones.
     * As popups get closed, shift other popups forward.
     * Otherwise using the number of active UIs can lead to collision.
     *
     * @param {PlayerDesk} playerDesk
     */
    _moveUIs(playerDesk) {
        assert(playerDesk);

        const playerSlot = playerDesk.playerSlot;

        // Active are in add-order.
        const active = _playerSlotToActiveAbstractStrategyCards[playerSlot];
        if (!active || active.length === 0) {
            return;
        }

        let nextOffset = 0;
        const deltaOffset = 0.2;
        for (const abstractStrategyCard of active) {
            const ui = abstractStrategyCard._playerSlotToUi[playerSlot];
            if (!ui) {
                continue; // "can't happen"
            }
            ui.position = playerDesk.localPositionToWorld({
                x: 10 + nextOffset,
                y: 0,
                z: 5,
            });
            world.updateUI(ui);
            nextOffset += deltaOffset;
        }
    }

    _addUI(playerDesk) {
        assert(playerDesk);

        // Track per-desk active strategy cards.
        const playerSlot = playerDesk.playerSlot;
        let active = _playerSlotToActiveAbstractStrategyCards[playerSlot];
        if (!active) {
            active = [];
            _playerSlotToActiveAbstractStrategyCards[playerSlot] = active;
        }
        if (active.includes(this)) {
            console.log(
                `AbstractStrategyCard._addUI: already visible for ${playerDesk.colorName}, skipping`
            );
            return; // UI already visible to this player
        }
        active.push(this);

        const verticalBox = new VerticalBox().setChildDistance(SPACING);

        // Create widget header.
        this._createHeader(verticalBox);

        // Create widget body.
        const bodyWidgets = this._bodyWidgetFactory(
            playerDesk,
            this._gameObject
        );
        assert(Array.isArray(bodyWidgets));
        for (const bodyWidget of bodyWidgets) {
            assert(bodyWidget instanceof Widget);
            verticalBox.addChild(bodyWidget);
        }

        // Create widget footer.
        this._createFooter(verticalBox, playerDesk);

        // Automator buttons?
        if (this._automatorButtons) {
            this._createAutomoatorButtons(verticalBox);
        }

        // Wrap in a padded frame.
        let widget = new LayoutBox()
            .setPadding(5, 5, 0, 5)
            .setChild(verticalBox);
        widget = new Border().setColor(this._color).setChild(widget);

        // Add UI.
        const ui = new UIElement();
        ui.anchorY = 1;
        ui.position = playerDesk.localPositionToWorld({
            x: 10 + active.length * 2,
            y: 0,
            z: 5,
        });
        ui.rotation = playerDesk.localRotationToWorld(new Rotator(35, 0, 0));
        ui.scale = 1 / SCALE;
        ui.widget = widget;

        world.addUI(ui);

        assert(!this._playerSlotToUi[playerSlot]);
        this._playerSlotToUi[playerSlot] = ui;

        this._moveUIs(playerDesk);
    }

    _removeUI(playerDesk) {
        assert(playerDesk);

        // Track per-desk active strategy cards.
        const playerSlot = playerDesk.playerSlot;
        const active = _playerSlotToActiveAbstractStrategyCards[playerSlot];
        const index = active ? active.indexOf(this) : -1;
        if (index >= 0) {
            active.splice(index, 1);
        }

        // Remove UI.
        const ui = this._playerSlotToUi[playerSlot];
        this._playerSlotToUi[playerSlot] = undefined;
        if (ui) {
            world.removeUIElement(ui);
        }
    }

    _createHeader(verticalBox) {
        assert(verticalBox instanceof VerticalBox);

        const parsed = ObjectNamespace.parseStrategyCard(this._gameObject);
        const nsidName = parsed.card;
        const headerText = new Text()
            .setFont("handel-gothic-regular.ttf", refPackageId)
            .setFontSize(FONT_SIZE_TITLE)
            .setText(locale(`strategy_card.${nsidName}.text`).toUpperCase());
        verticalBox.addChild(headerText);
    }

    _createFooter(verticalBox, playerDesk) {
        assert(verticalBox instanceof VerticalBox);
        assert(playerDesk);

        const onCloseClicked = (button, player) => {
            this._removeUI(playerDesk);
        };
        const closeButton = new Button()
            .setFontSize(FONT_SIZE_BODY)
            .setTextColor(new Color(0.972, 0.317, 0.286))
            .setText(locale("strategy_card.base.button.close"));
        closeButton.onClicked.add(ThrottleClickHandler.wrap(onCloseClicked));
        verticalBox.addChild(closeButton);
    }

    _createAutomoatorButtons(verticalBox) {
        assert(verticalBox instanceof VerticalBox);
        assert(Array.isArray(this._automatorButtons));

        const headerText = new Text()
            .setFont("handel-gothic-regular.ttf", refPackageId)
            .setFontSize(FONT_SIZE_TITLE / 2)
            .setText(locale(`strategy_card.automator.title`).toUpperCase());

        const panel = new VerticalBox()
            .setChildDistance(SPACING)
            .addChild(headerText);

        for (const automatorButton of this._automatorButtons) {
            const button = new Button()
                .setFontSize((FONT_SIZE_BODY * 3) / 4)
                .setText(automatorButton.actionName);
            button.onClicked.add(
                ThrottleClickHandler.wrap(automatorButton.handler)
            );
            panel.addChild(button);
        }

        const p = 8 * SCALE;
        const padded = new LayoutBox()
            .setPadding(p, p, p / 2, p / 2)
            .setChild(panel);
        const border = new Border().setChild(padded);
        verticalBox.addChild(border);
    }

    /**
     * Create primary/seconcary buttons.
     *
     * @param {PlayerDesk} playerDesk
     * @param {GameObject} strategyCardObj
     * @returns {Array.{Widget}}
     */
    _defaultBodyWidgetFactory(playerDesk, strategyCardObj) {
        assert(playerDesk);

        const primaryButton = AbstractStrategyCard.createButtonPlayPrimary(
            playerDesk,
            this._gameObject
        );

        const secondaryButton = AbstractStrategyCard.createButtonPlaySecondary(
            playerDesk,
            this._gameObject
        );

        const passButton = AbstractStrategyCard.createButtonPlayPass(
            playerDesk,
            this._gameObject
        );

        return [primaryButton, secondaryButton, passButton];
    }
}

module.exports = {
    AbstractStrategyCard,
    FONT_SIZE_PLAY_BUTTON,
    FONT_SIZE_TITLE,
    FONT_SIZE_BODY,
    SCALE,
    SPACING,
};
