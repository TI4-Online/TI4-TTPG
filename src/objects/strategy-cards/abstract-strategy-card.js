const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const CONFIG = require("../../game-ui/game-ui-config");
const { Broadcast } = require("../../lib/broadcast");
const { ObjectNamespace } = require("../../lib/object-namespace");
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
    globalEvents,
    refPackageId,
    world,
} = require("../../wrapper/api");
const { ThrottleClickHandler } = require("../../lib/ui/throttle-click-handler");
const { ColorUtil } = require("../../lib/color/color-util");

// If a new strategy card is played while a player still has one open,
// position the new UI behind the other(s).
const _playerSlotToActiveAbstractStrategyCards = {};

const SCALE = 2;
const FONT_SIZE_PLAY_BUTTON = 9 * SCALE;
const FONT_SIZE_TITLE = 14 * SCALE;
const FONT_SIZE_BODY = 10 * SCALE;

/**
 * Manage strategy card UI.
 *
 * UI always has a title at the top and a pass button at the bottom.
 * The default body is "active/passed" buttons, subclasses can override that
 * by calling `setBodyWidgetFactory` passing in a function taking (verticalBox,
 * playerDesk, closeHandler) arguments.
 */
class AbstractStrategyCard {
    static getStrategyCardName(gameObject) {
        assert(gameObject instanceof GameObject);
        assert(ObjectNamespace.isStrategyCard(gameObject));

        const parsed = ObjectNamespace.parseStrategyCard(gameObject);
        return parsed ? locale(`tile.strategy.${parsed.card}`) : "?";
    }

    /**
     * Add "play" button and context menu item.
     *
     * Play triggers the globalEvents.TI4.onStrategyCardPlayed event.
     *
     * @param {GameObject} gameObject - strategy card
     */
    static addPlayButton(gameObject) {
        assert(gameObject instanceof GameObject);
        assert(ObjectNamespace.isStrategyCard(gameObject));

        const cardName = AbstractStrategyCard.getStrategyCardName(gameObject);
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
            globalEvents.TI4.onStrategyCardPlayed.trigger(gameObject, player);
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
        gameObject.addUI(ui);

        // Also add as a context menu item.
        const playActionName = "*" + playButtonName;
        gameObject.addCustomAction(playActionName, playButtonTooltip);
        gameObject.onCustomAction.add((obj, player, actionName) => {
            if (actionName === playActionName) {
                handleOnPlayButtonClicked(playButton, player);
            }
        });
    }

    /**
     * Set up globalEvents.TI4.onStrategyCardMovementStopped triggering when
     * the game object stops moving (e.g. selected by a player, flipped, etc).
     *
     * @param {GameObject} gameObject - strategy card
     */
    static addOnMovementStoppedTrigger(gameObject) {
        assert(gameObject instanceof GameObject);
        assert(ObjectNamespace.isStrategyCard(gameObject));

        // TTPG can keep sending this event (physics?), suppress if not changed much.
        let lastLossy = "";
        gameObject.onMovementStopped.add((obj) => {
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

    constructor(gameObject) {
        assert(gameObject instanceof GameObject);
        assert(ObjectNamespace.isStrategyCard(gameObject));

        this._gameObject = gameObject;
        this._color = new Color(1, 1, 1);
        this._bodyWidgetFactory = (verticalBox, playerDesk, closeHandler) => {
            assert(verticalBox instanceof VerticalBox);
            assert(playerDesk);
            assert(typeof closeHandler === "function");
            this._defaultBodyWidgetFactory(
                verticalBox,
                playerDesk,
                closeHandler
            );
        };
        this._automatorOptions = undefined;
        this._playerSlotToUi = {};

        const playListener = (obj, player) => {
            if (obj === gameObject) {
                for (const playerDesk of world.TI4.getAllPlayerDesks()) {
                    const closeHandler = () => {
                        this._removeUI(playerDesk);
                    };
                    this._addUI(playerDesk, closeHandler);
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
    addAutomatorOption(actionName, handler) {
        assert(typeof actionName === "string");
        assert(typeof handler === "function");
        return this;
    }

    _addUI(playerDesk, closeHandler) {
        assert(playerDesk);
        assert(typeof closeHandler === "function");

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

        const verticalBox = new VerticalBox();

        // Create widget header.
        const parsed = ObjectNamespace.parseStrategyCard(this._gameObject);
        const nsidName = parsed.card;
        const headerText = new Text()
            .setFont("handel-gothic-regular.ttf", refPackageId)
            .setFontSize(FONT_SIZE_TITLE)
            .setText(locale(`strategy_card.${nsidName}.text`).toUpperCase());
        verticalBox.addChild(headerText);

        // Create widget body.
        this._bodyWidgetFactory(verticalBox, playerDesk, closeHandler);

        // Create widget footer.
        const onPassClicked = (button, player) => {
            Broadcast.chatAll(
                locale(`strategy_card.${nsidName}.message.pass`, {
                    playerName: player.getName(),
                }),
                player.getPlayerColor()
            );
        };
        const passButton = new Button()
            .setFontSize(FONT_SIZE_BODY)
            .setTextColor(new Color(0.972, 0.317, 0.286))
            .setText(locale("strategy_card.base.button.pass"));
        passButton.onClicked.add(onPassClicked);
        passButton.onClicked.add(closeHandler);
        verticalBox.addChild(passButton);

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
    }

    _removeUI(playerDesk) {
        assert(playerDesk);

        // Track per-desk active strategy cards.
        const playerSlot = playerDesk.playerSlot;
        const active = _playerSlotToActiveAbstractStrategyCards[playerSlot];
        assert(active);
        const index = active.indexOf(this);
        assert(index >= 0);
        active.splice(index, 1);

        // Remove UI.
        const ui = this._playerSlotToUi[playerSlot];
        this._playerSlotToUi[playerSlot] = undefined;
        assert(ui);
        world.removeUIElement(ui);
    }

    /**
     * Create primary/seconcary buttons.
     *
     * @param {PlayerDesk} playerDesk
     * @param {function} closeHandler - takes no arguments
     */
    _defaultBodyWidgetFactory(verticalBox, playerDesk, closeHandler) {
        assert(verticalBox instanceof VerticalBox);
        assert(playerDesk);
        assert(typeof closeHandler === "function");

        const parsed = ObjectNamespace.parseStrategyCard(this._gameObject);
        const nsidName = parsed.card;
        const onPrimaryClicked = (button, player) => {
            Broadcast.chatAll(
                locale(`strategy_card.${nsidName}.message.primary`, {
                    playerName: player.getName(),
                }),
                player.getPlayerColor()
            );
        };
        const onSecondaryClicked = (button, player) => {
            Broadcast.chatAll(
                locale(`strategy_card.${nsidName}.message.secondary`, {
                    playerName: player.getName(),
                }),
                player.getPlayerColor()
            );
        };

        const primaryButton = new Button()
            .setFontSize(FONT_SIZE_BODY)
            .setText(locale("strategy_card.base.button.primary"));
        primaryButton.onClicked.add(onPrimaryClicked);
        primaryButton.onClicked.add(closeHandler);

        const secondaryButton = new Button()
            .setFontSize(FONT_SIZE_BODY)
            .setText(locale("strategy_card.base.button.secondary"));
        secondaryButton.onClicked.add(onSecondaryClicked);
        secondaryButton.onClicked.add(closeHandler);

        verticalBox.addChild(primaryButton).addChild(secondaryButton);
    }
}

module.exports = {
    AbstractStrategyCard,
    FONT_SIZE_PLAY_BUTTON,
    FONT_SIZE_TITLE,
    FONT_SIZE_BODY,
    SCALE,
};
