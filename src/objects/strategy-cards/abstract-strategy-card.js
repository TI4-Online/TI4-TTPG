const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const CONFIG = require("../../game-ui/game-ui-config");
const { Broadcast } = require("../../lib/broadcast");
const { ColorUtil } = require("../../lib/color/color-util");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { ThrottleClickHandler } = require("../../lib/ui/throttle-click-handler");
const { WidgetFactory } = require("../../lib/ui/widget-factory");
const {
    Color,
    GameObject,
    HorizontalAlignment,
    Rotator,
    Vector,
    VerticalBox,
    Widget,
    globalEvents,
    refPackageId,
    world,
} = require("../../wrapper/api");
const { CollapsiblePanel } = require("../../lib/ui/collapsible-panel");

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
            const playerSlot = player.getSlot();
            const playerName = world.TI4.getNameByPlayerSlot(playerSlot);
            const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
            const color = playerDesk
                ? playerDesk.chatColor
                : player.getPrimaryColor();
            const msg = locale("ui.message.strategy_card_play", {
                playerName,
                cardName,
            });
            Broadcast.broadcastAll(msg, color);

            // Tell any listeners.
            globalEvents.TI4.onStrategyCardPlayed.trigger(
                strategyCardObj,
                player
            );
        };

        // Setup the play button
        const playButton = WidgetFactory.button()
            .setFontSize(FONT_SIZE_PLAY_BUTTON)
            .setText(playButtonName);
        playButton.onClicked.add(
            ThrottleClickHandler.wrap(handleOnPlayButtonClicked)
        );
        const ui = WidgetFactory.uiElement();
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
        const msgColor = playerDesk.chatColor;
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
        const primaryButton = WidgetFactory.button()
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
        const msgColor = playerDesk.chatColor;
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
        const secondaryButton = WidgetFactory.button()
            .setFontSize(FONT_SIZE_BODY)
            .setText(locale("strategy_card.base.button.secondary"));
        secondaryButton.onClicked.add(
            ThrottleClickHandler.wrap(onSecondaryClicked)
        );
        return secondaryButton;
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
                    if (playerDesk.eliminated) {
                        continue;
                    }
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
            ui.rotation = playerDesk.localRotationToWorld(
                new Rotator(35, 0, 0)
            );
            playerDesk.updateUI(ui, true);
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

        const verticalBox =
            WidgetFactory.verticalBox().setChildDistance(SPACING);

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
            this._createAutomoatorButtons(verticalBox, playerDesk);
        }

        // Build a collapsible widget.
        const title = AbstractStrategyCard.getStrategyCardName(
            this._gameObject
        );
        const collapsiblePanel = new CollapsiblePanel()
            .setColor(this._color)
            .setChild(verticalBox)
            .setClosable(true)
            .setScale(SCALE)
            .setTitle(title);
        collapsiblePanel.onClosed.add((player) => {
            this._removeUI(playerDesk);
        });

        // Add UI.
        const ui = WidgetFactory.uiElement();
        ui.anchorY = 1;
        ui.position = playerDesk.localPositionToWorld({
            x: 10 + active.length * 2,
            y: 0,
            z: 5,
        });
        ui.rotation = playerDesk.localRotationToWorld(new Rotator(35, 0, 0));
        ui.scale = 1 / SCALE;
        ui.widget = collapsiblePanel.createWidget();

        // TTPG/Unreal has a cap on single-instance objects, world UI is one bucket.
        // Spread out strategy card UI to per-player objects.
        playerDesk.addUI(ui);

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
            playerDesk.removeUIElement(ui);
            WidgetFactory.release(ui);
        } else {
            // Searching for why "close" isn't working for some players sometime.
            Broadcast.chatAll(
                "AbstractStrategyCard: removeUI already removed?",
                Broadcast.ERROR
            );
        }
    }

    _getTitle() {
        const parsed = ObjectNamespace.parseStrategyCard(this._gameObject);
        const nsidName = parsed.card;
        const localeName = `strategy_card.${nsidName}.text`;
        let title = locale(localeName);
        if (title === localeName) {
            // Strategy card name not registered?
        }
        return (title = title.toUpperCase());
    }

    _createHeader(verticalBox, playerDesk) {
        assert(verticalBox instanceof VerticalBox);
        assert(playerDesk);

        const strategyCardName = AbstractStrategyCard.getStrategyCardName(
            this._gameObject
        );
        const headerText = WidgetFactory.text()
            .setFont("handel-gothic-regular.ttf", refPackageId)
            .setFontSize(FONT_SIZE_TITLE)
            .setText(strategyCardName.toUpperCase());

        const onCloseClicked = (clickedButton, player) => {
            this._removeUI(playerDesk);
        };
        const closeButton = WidgetFactory.button()
            .setFontSize(FONT_SIZE_TITLE * 0.75)
            .setText("X");
        closeButton.onClicked.add(ThrottleClickHandler.wrap(onCloseClicked));

        const header = WidgetFactory.horizontalBox()
            .addChild(headerText, 1)
            .addChild(closeButton, 0);

        verticalBox.addChild(header);
    }

    _createFooter(verticalBox, playerDesk) {
        assert(verticalBox instanceof VerticalBox);
        assert(playerDesk);

        const playerSlot = playerDesk.playerSlot;
        const playerName = world.TI4.getNameByPlayerSlot(playerSlot);
        const msgColor = playerDesk.chatColor;
        const cardName = AbstractStrategyCard.getStrategyCardName(
            this._gameObject
        );

        const onPassClicked = (button, player) => {
            Broadcast.chatAll(
                locale(`strategy_card.base.message.pass`, {
                    playerName,
                    cardName,
                }),
                msgColor
            );
        };
        const passButton = WidgetFactory.button()
            .setFontSize(FONT_SIZE_BODY)
            .setText(locale("strategy_card.base.button.pass"));
        passButton.onClicked.add(ThrottleClickHandler.wrap(onPassClicked));

        const onCloseClicked = (clickedButton, player) => {
            this._removeUI(playerDesk);
        };
        const closeButton = WidgetFactory.button()
            .setFontSize(FONT_SIZE_BODY * 1.5)
            .setTextColor(new Color(0.972, 0.317, 0.286))
            .setText(locale("strategy_card.base.button.close").toUpperCase());
        closeButton.onClicked.add(ThrottleClickHandler.wrap(onCloseClicked));

        verticalBox.addChild(passButton).addChild(closeButton);
    }

    _createAutomoatorButtons(verticalBox, playerDesk) {
        assert(verticalBox instanceof VerticalBox);
        assert(playerDesk);
        assert(Array.isArray(this._automatorButtons));

        const panel = WidgetFactory.verticalBox().setChildDistance(SPACING);

        const automatorButtons = [];
        let showing = false;
        const updatePanel = () => {
            for (const button of automatorButtons) {
                button.setVisible(showing);
            }
        };

        const toggleButton = WidgetFactory.button()
            .setFont("handel-gothic-regular.ttf", refPackageId)
            .setFontSize(FONT_SIZE_TITLE / 2)
            .setText(locale(`strategy_card.automator.title`).toUpperCase());
        toggleButton.onClicked.add(
            ThrottleClickHandler.wrap((button, player) => {
                showing = !showing;
                updatePanel();
            })
        );

        // Wrap so toggle button doesn't stretch to edges.
        const wrappedToggleButton = WidgetFactory.layoutBox()
            .setHorizontalAlignment(HorizontalAlignment.Center)
            .setChild(toggleButton);

        panel.addChild(wrappedToggleButton);

        // Always create buttons, show/hide visibility.
        for (const automatorButton of this._automatorButtons) {
            const button = WidgetFactory.button()
                .setFontSize(FONT_SIZE_BODY)
                .setText(automatorButton.actionName);
            const onClicked = (clickedButton, player) => {
                automatorButton.handler(playerDesk, player);
            };
            button.onClicked.add(ThrottleClickHandler.wrap(onClicked));
            panel.addChild(button);
            automatorButtons.push(button);
        }

        updatePanel();

        const p = 8 * SCALE;
        const padded = WidgetFactory.layoutBox()
            .setPadding(p, p, p / 2, p / 2)
            .setChild(panel);
        const border = WidgetFactory.border()
            .setColor(CONFIG.backgroundColor)
            .setChild(padded);
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

        return [primaryButton, secondaryButton];
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
