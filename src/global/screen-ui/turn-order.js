const assert = require("../../wrapper/assert-wrapper");
const { Broadcast } = require("../../lib/broadcast");
const { ColorUtil } = require("../../lib/color/color-util");
const { ThrottleClickHandler } = require("../../lib/ui/throttle-click-handler");
const { TurnOrderPanel } = require("../../lib/ui/turn-order/turn-order-panel");
const {
    Border,
    Button,
    HorizontalAlignment,
    ImageButton,
    LayoutBox,
    PlayerPermission,
    ScreenUIElement,
    VerticalAlignment,
    globalEvents,
    refPackageId,
    world,
} = require("../../wrapper/api");

const SIMPLE_WIDTH = 175;
const SIMPLE_ENTRY_HEIGHT = 35;
const FANCY_WIDTH = 220;
const FANCY_ENTRY_HEIGHT = 58;
const TIMER_FONT_SIZE = 14;
const TIMER_HEIGHT = 35;
const PAD = 14;
const BUTTON_SIZE = 10;

const PLAYER_STATE = {
    FANCY: 1,
    SIMPLE: 2,
    NONE: 3,
};

class TurnOrderScreenUI {
    constructor() {
        this._playerSlotToPlayerState = {};

        this._simplePlayerSlots = [];
        this._fancyPlayerSlots = Array.from(Array(20).keys());

        this._simpleUI = this.createSimpleUI();
        this._simpleUIadded = false;

        this._fancyUI = this.createFancyUI();
        this._fancyUIadded = true;
        world.addScreenUI(this._fancyUI);

        this._toggleUI = this.createToggleUI();
        world.addScreenUI(this._toggleUI);

        const resetHeightHandler = () => {
            this.resetHeight();
        };
        globalEvents.TI4.onPlayerCountChanged.add(resetHeightHandler);
        globalEvents.TI4.onTimerConfigChanged.add(resetHeightHandler);

        this.resetHeight();
    }

    resetHeight() {
        const timerHeight = world.TI4.config.timer >= 0 ? TIMER_HEIGHT : 0;
        this._simpleUI.height =
            SIMPLE_ENTRY_HEIGHT * world.TI4.config.playerCount +
            PAD +
            timerHeight;
        world.updateScreenUI(this._simpleUI);

        this._fancyUI.height =
            FANCY_ENTRY_HEIGHT * world.TI4.config.playerCount +
            PAD +
            timerHeight;
        world.updateScreenUI(this._fancyUI);
    }

    toggle(player) {
        console.log(`TurnOrderScreenUI.toggle "${player.getName()}"`);

        const playerSlot = player.getSlot();
        let playerState =
            this._playerSlotToPlayerState[playerSlot] || PLAYER_STATE.FANCY;
        if (playerState === PLAYER_STATE.FANCY) {
            playerState = PLAYER_STATE.SIMPLE;
        } else if (playerState === PLAYER_STATE.SIMPLE) {
            playerState = PLAYER_STATE.NONE;
        } else if ((playerState = PLAYER_STATE.NONE)) {
            playerState = PLAYER_STATE.FANCY;
        } else {
            throw new Error(`bad state ${playerState}`);
        }
        this._playerSlotToPlayerState[playerSlot] = playerState;

        this.setFancyUI(playerSlot, playerState === PLAYER_STATE.FANCY);
        this.setSimpleUI(playerSlot, playerState === PLAYER_STATE.SIMPLE);
    }

    moveToggleButtonToTop() {
        world.removeScreenUIElement(this._toggleUI);
        world.addScreenUI(this._toggleUI);
    }

    setFancyUI(playerSlot, visible) {
        assert(typeof playerSlot === "number");
        assert(typeof visible === "boolean");

        const index = this._fancyPlayerSlots.indexOf(playerSlot);
        if (visible) {
            if (index >= 0) {
                return; // already visible
            }
            this._fancyPlayerSlots.push(playerSlot);
        } else {
            if (index < 0) {
                return; // already hidden
            }
            this._fancyPlayerSlots.splice(index, 1);
        }

        const playerPermission = new PlayerPermission().setPlayerSlots(
            this._fancyPlayerSlots
        );
        this._fancyUI.players = playerPermission;

        if (this._fancyPlayerSlots.length === 0 && this._fancyUIadded) {
            world.removeScreenUIElement(this._fancyUI);
            this._fancyUIadded = false;
        } else if (this._fancyPlayerSlots.length > 0 && !this._fancyUIadded) {
            world.addScreenUI(this._fancyUI);
            this._fancyUIadded = true;
            this.moveToggleButtonToTop();
        }

        if (this._fancyUIadded) {
            world.updateScreenUI(this._fancyUI);
        }
    }

    setSimpleUI(playerSlot, visible) {
        assert(typeof playerSlot === "number");
        assert(typeof visible === "boolean");

        const index = this._simplePlayerSlots.indexOf(playerSlot);
        if (visible) {
            if (index >= 0) {
                return; // already visible
            }
            this._simplePlayerSlots.push(playerSlot);
        } else {
            if (index < 0) {
                return; // already hidden
            }
            this._simplePlayerSlots.splice(index, 1);
        }

        const playerPermission = new PlayerPermission().setPlayerSlots(
            this._simplePlayerSlots
        );
        this._simpleUI.players = playerPermission;

        if (this._simplePlayerSlots.length === 0 && this._simpleUIadded) {
            world.removeScreenUIElement(this._simpleUI);
            this._simpleUIadded = false;
        } else if (this._simplePlayerSlots.length > 0 && !this._simpleUIadded) {
            world.addScreenUI(this._simpleUI);
            this._simpleUIadded = true;
            this.moveToggleButtonToTop();
        }

        if (this._simpleUIadded) {
            world.updateScreenUI(this._simpleUI);
        }
    }

    createToggleUI() {
        const c = 0.3;
        const button = new ImageButton()
            .setImage("global/ui/white16x16.png", refPackageId)
            .setImageSize(BUTTON_SIZE, BUTTON_SIZE)
            .setTintColor([c, c, c, 1]);
        button.onClicked.add((clickedButton, player) => {
            this.toggle(player);
        });

        // Screen UI can be placed and sized with relative values, but that
        // means UI will vary with screen size.  Since we cannot (yet) center
        // a fixed-size element, place a fixed-side box inside another.
        // This is definitely a hack.
        // This goes away when screen UI can be fixed size.
        const imageButtonBorder = 2;
        const right =
            Math.round(PAD + FANCY_WIDTH / 2 - BUTTON_SIZE / 2) -
            imageButtonBorder;
        const top = Math.round(PAD - (BUTTON_SIZE * 3) / 4) - imageButtonBorder;
        const buttonBox = new LayoutBox()
            .setPadding(0, right, top, 0)
            .setHorizontalAlignment(HorizontalAlignment.Right)
            .setVerticalAlignment(VerticalAlignment.Top)
            .setChild(button);

        const ui = new ScreenUIElement();
        ui.relativeWidth = true;
        ui.width = 0.2;
        ui.relativeHeight = false;
        ui.height = BUTTON_SIZE + PAD;
        ui.relativePositionX = true;
        ui.positionX = 1 - ui.width;

        ui.relativePositionY = false;
        ui.positionY = 0;

        ui.widget = buttonBox;

        return ui;
    }

    /**
     * Turn order list, positioned in upper right slightly offset from screen edge.
     *
     * @returns {ScreenUIElement}
     */
    createFancyUI() {
        // Fancy hard codes font sizes and fit lengths.
        const turnOrderPanel = new TurnOrderPanel().setUseFancyWidgets(true);

        const turnOrderWidget = turnOrderPanel.getWidget();
        turnOrderWidget.addChild(this._getTimerWidget());

        // Screen UI can be placed and sized with relative values, but that
        // means UI will vary with screen size.  Since we cannot (yet) center
        // a fixed-size element, place a fixed-side box inside another.
        // This is definitely a hack.
        // This goes away when screen UI can be fixed size.
        const inner = new LayoutBox()
            .setOverrideWidth(FANCY_WIDTH)
            .setChild(turnOrderWidget);

        const c = 0.3;
        const frame = new Border().setColor([c, c, c, 1]).setChild(inner);

        const outer = new LayoutBox()
            .setHorizontalAlignment(HorizontalAlignment.Right)
            .setPadding(0, PAD, PAD, 0)
            .setChild(frame);

        const ui = new ScreenUIElement();
        ui.relativeWidth = true;
        ui.width = 0.2;
        ui.relativeHeight = false;
        ui.height = 0; // call resetHeight to set
        ui.relativePositionX = true;
        ui.positionX = 1 - ui.width;

        ui.relativePositionY = false;
        ui.positionY = 0;

        ui.widget = outer;

        const playerPermission = new PlayerPermission().setPlayerSlots(
            this._fancyPlayerSlots
        );
        ui.players = playerPermission;

        return ui;
    }

    createSimpleUI() {
        // Fancy hard codes font sizes and fit lengths.
        const turnOrderPanel = new TurnOrderPanel()
            .setUseFancyWidgets(false)
            .setFontSize(SIMPLE_ENTRY_HEIGHT * 0.4)
            .setEnableButtons(false);

        const turnOrderWidget = turnOrderPanel.getWidget();
        turnOrderWidget.addChild(this._getTimerWidget());

        // Screen UI can be placed and sized with relative values, but that
        // means UI will vary with screen size.  Since we cannot (yet) center
        // a fixed-size element, place a fixed-side box inside another.
        // This is definitely a hack.
        // This goes away when screen UI can be fixed size.
        const inner = new LayoutBox()
            .setOverrideWidth(SIMPLE_WIDTH)
            .setChild(turnOrderWidget);

        const c = 0.3;
        const frame = new Border().setColor([c, c, c, 1]).setChild(inner);

        const outer = new LayoutBox()
            .setHorizontalAlignment(HorizontalAlignment.Right)
            .setPadding(0, PAD, PAD, 0)
            .setChild(frame);

        const ui = new ScreenUIElement();
        ui.relativeWidth = true;
        ui.width = 0.2;
        ui.relativeHeight = false;
        ui.height = 0; // call resetHeight to set
        ui.relativePositionX = true;
        ui.positionX = 1 - ui.width;

        ui.relativePositionY = false;
        ui.positionY = 0;

        ui.widget = outer;

        const playerPermission = new PlayerPermission().setPlayerSlots(
            this._simplePlayerSlots
        );
        ui.players = playerPermission;

        return ui;
    }

    _getTimerWidget() {
        const timer = new Button()
            .setFontSize(TIMER_FONT_SIZE)
            .setTextColor(ColorUtil.colorFromHex("#cb0000"))
            .setText("0:00");

        const updateTimerVisibility = () => {
            const timerValue = world.TI4.config.timer;
            const visible = timerValue >= 0;
            timer.setVisible(visible);
        };

        let anchorTimestamp = Date.now();
        let anchorValue = 0;

        const updateTimer = () => {
            const timerValue = world.TI4.config.timer;
            const now = Date.now();
            const delta = (now - anchorTimestamp) / 1000;
            const value = anchorValue + delta;
            let display = Math.floor(
                timerValue > 0 ? timerValue - value : value
            );
            const sign = display >= 0 ? "" : "-";
            display = Math.abs(display);
            let minutes = Math.floor(display / 60);
            let seconds = display % 60;
            minutes = String(minutes).padStart(2, "0");
            seconds = String(seconds).padStart(2, "0");
            const text = `${sign}${minutes}:${seconds}`;
            timer.setText(text);
        };

        updateTimerVisibility();
        updateTimer();

        // Click to pause timer.
        let intervalHandle = setInterval(updateTimer, 1000);
        timer.onClicked.add(
            ThrottleClickHandler.wrap((button, player) => {
                const playerName = world.TI4.getNameByPlayerSlot(
                    player.getSlot()
                );
                const action = intervalHandle ? "paused" : "resumed";
                const msg = `${playerName} ${action} turn timer`;
                Broadcast.chatAll(msg);

                if (intervalHandle) {
                    // Record value for resume.
                    const now = Date.now();
                    const delta = (now - anchorTimestamp) / 1000;
                    anchorValue += delta;

                    // Stop timer.
                    clearInterval(intervalHandle);
                    intervalHandle = undefined;
                } else {
                    anchorTimestamp = Date.now();
                    intervalHandle = setInterval(updateTimer, 1000);
                }
            })
        );

        globalEvents.TI4.onTimerConfigChanged.add(updateTimerVisibility);
        globalEvents.TI4.onTurnChanged.add(() => {
            anchorTimestamp = Date.now();
            anchorValue = 0;
        });

        return timer;
    }
}

if (!world.__isMock) {
    // Give the world a little time to set up.
    let ticksRemaining = 10;
    const maybeGo = () => {
        if (ticksRemaining-- > 0) {
            process.nextTick(maybeGo);
            return;
        }
        new TurnOrderScreenUI();
    };
    maybeGo();
}
