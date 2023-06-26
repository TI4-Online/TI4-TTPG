const assert = require("../wrapper/assert-wrapper");
const locale = require("../lib/locale");
const CONFIG = require("../game-ui/game-ui-config");
const { Broadcast } = require("../lib/broadcast");
const { ColorUtil } = require("../lib/color/color-util");
const { ObjectSavedData } = require("../lib/saved-data/object-saved-data");
const { ThrottleClickHandler } = require("../lib/ui/throttle-click-handler");
const {
    Border,
    Button,
    CheckBox,
    GameObject,
    ImageButton,
    HorizontalBox,
    LayoutBox,
    Text,
    TextJustification,
    UIElement,
    Vector,
    VerticalBox,
    globalEvents,
    refObject,
    refPackageId,
    world,
} = require("../wrapper/api");

const KEY_VALUE = "value";
const KEY_COUNTDOWN = "countdown";
const KEY_ACTIVE = "active";

const SCALE = 2;
const FONT_SIZE = 33 * SCALE;
const CHILD_DISTANCE = 5 * SCALE;

class Timer {
    constructor(gameObject) {
        assert(gameObject instanceof GameObject);

        this._obj = gameObject;
        this._periodicHandler = undefined;
        this._editUI = undefined;

        // Anchor timestamp is when the timer was last started, and the value
        // at that time (compute new value from anchor to avoid timer drift).
        this._anchorTimestamp = undefined;
        this._anchorValue = undefined;

        // Value is what is currently being shown.
        this._value = Number.parseInt(
            ObjectSavedData.get(this._obj, KEY_VALUE, "0")
        ); // value when last started

        // If set, count down from this many seconds.
        this._countdownFromSeconds = Number.parseInt(
            ObjectSavedData.get(this._obj, KEY_COUNTDOWN, "-1")
        );

        const z = gameObject.getExtent().z + 0.01;
        assert(typeof z === "number");

        this._timerWidget = new Button()
            .setFont("VT323-Regular.ttf", refPackageId)
            .setFontSize(FONT_SIZE)
            .setTextColor(ColorUtil.colorFromHex("#cb0000"))
            .setText("00:00:00");

        this._timerWidget.onClicked.add((button, player) => {
            this._toggleTimer();
        });

        const d = Math.floor(FONT_SIZE * 0.4);
        const editButton = new ImageButton()
            .setImage("global/ui/menu_button_hex.png", refPackageId)
            .setImageSize(d, d);
        editButton.onClicked.add((button, player) => {
            this._showEditUI();
        });

        const panel = new HorizontalBox()
            .setChildDistance(CHILD_DISTANCE)
            .addChild(this._timerWidget)
            .addChild(editButton);

        const ui = new UIElement();
        ui.position = new Vector(0, 0, z);
        ui.scale = 1 / SCALE;
        ui.widget = panel;

        this._obj.addUI(ui);

        globalEvents.TI4.onGameSetup.add(() => {
            this._startTimer();
        });

        const isActive = ObjectSavedData.get(this._obj, KEY_ACTIVE, false);
        if (isActive) {
            this._startTimer();
        }

        this._update();
    }

    getValue() {
        return this._value;
    }

    getAnchorTimestamp() {
        return this._anchorTimestamp;
    }

    getAnchorValue() {
        return this._anchorValue;
    }

    getCountdownFrom() {
        return this._countdownFromSeconds;
    }

    getDirection() {
        if (!this._periodicHandler) {
            return 0; // not running
        }
        return this._countdownFromSeconds > 0 ? -1 : 1;
    }

    startCountdown(seconds) {
        assert(typeof seconds === "number");
        assert(seconds > 0);

        this._stopTimer();

        Broadcast.chatAll(locale("timer.startCountdown"));

        this._value = 0;
        this._countdownFromSeconds = seconds;
        ObjectSavedData.set(
            this._obj,
            KEY_COUNTDOWN,
            String(this._countdownFromSeconds)
        );

        this._startTimer();
        this._update();
    }

    startCountup(seconds) {
        assert(typeof seconds === "number");
        assert(seconds >= 0);

        this._stopTimer();

        this._value = seconds;
        this._countdownFromSeconds = -1;
        ObjectSavedData.set(
            this._obj,
            KEY_COUNTDOWN,
            String(this._countdownFromSeconds)
        );

        this._startTimer();
        this._update();
    }

    _toggleTimer() {
        if (this._periodicHandler) {
            this._stopTimer();
        } else {
            this._startTimer();
        }
    }

    _startTimer() {
        console.log("Timer._startTimer");

        if (this._periodicHandler) {
            clearInterval(this._periodicHandler);
            this._periodicHandler = undefined;
        }

        this._anchorTimestamp = Math.floor(Date.now() / 1000);
        this._anchorValue = this._value;

        this._periodicHandler = setInterval(() => {
            this._update();
        }, 1000);

        ObjectSavedData.set(this._obj, KEY_ACTIVE, true);
    }

    _stopTimer() {
        console.log("Timer._stopTimer");

        if (this._periodicHandler) {
            clearInterval(this._periodicHandler);
            this._periodicHandler = undefined;
        }

        this._anchorTimestamp = undefined;
        this._anchorValue = undefined;

        ObjectSavedData.set(this._obj, KEY_ACTIVE, false);
    }

    _update() {
        // Update value?
        if (this._periodicHandler) {
            assert(typeof this._anchorTimestamp === "number");
            assert(typeof this._anchorValue === "number");

            const oldValue = this._value;
            const now = Math.floor(Date.now() / 1000);
            const delta = now - this._anchorTimestamp;
            const newValue = this._anchorValue + delta;

            this._value = newValue;

            ObjectSavedData.set(this._obj, KEY_VALUE, String(this._value));

            // Time ran out?
            if (
                this._countdownFromSeconds > 0 &&
                oldValue <= this._countdownFromSeconds &&
                newValue >= this._countdownFromSeconds
            ) {
                this._countdownExpired();

                // Start counting up.
                this.startCountup(0);
            }
        }

        let displayValue = this._value;
        if (this._countdownFromSeconds > 0) {
            displayValue = this._countdownFromSeconds - this._value;
            displayValue = Math.abs(displayValue); // start counting up
        }

        let hours = Math.floor(displayValue / 3600);
        let minutes = Math.floor((displayValue % 3600) / 60);
        let seconds = Math.floor(displayValue % 60);

        hours = String(hours).padStart(2, "0");
        minutes = String(minutes).padStart(2, "0");
        seconds = String(seconds).padStart(2, "0");

        const text = `${hours}:${minutes}:${seconds}`;
        this._timerWidget.setText(text);
    }

    _countdownExpired() {
        console.log("Timer._countdownExpired");

        Broadcast.chatAll(locale("timer.countdownExpired"));

        const sound = world.importSound("bing_bong.wav", refPackageId);
        if (!sound) {
            console.log("no sound?");
            return;
        }
        const startTime = 0;
        const volume = 0.75; // [0:2] range
        const loop = false;
        sound.play(startTime, volume, loop);
    }

    _showEditUI() {
        console.log("Timer._showEditUI");

        if (this._editUI) {
            console.log("Timer._showEditUI: already showing");
            return; // already showing
        }

        this._stopTimer();

        let displayValue = this._value;
        if (this._countdownFromSeconds > 0) {
            displayValue = this._countdownFromSeconds - this._value;
            displayValue = Math.abs(displayValue); // start counting up
        }

        let hours = Math.floor(displayValue / 3600);
        let minutes = Math.floor((displayValue % 3600) / 60);
        let seconds = Math.floor(displayValue % 60);

        // Use the CONFIG settings for this pop-up UI.
        const value = new Text()
            .setFontSize(CONFIG.fontSize)
            .setJustification(TextJustification.Center)
            .setText("00 : 00 : 00");
        const updateValue = () => {
            const text = [
                String(hours).padStart(2, "0"),
                String(minutes).padStart(2, "0"),
                String(seconds).padStart(2, "0"),
            ].join(" : ");
            value.setText(text);
        };
        updateValue();

        const addH = new Button().setFontSize(CONFIG.fontSize).setText("+");
        const addM = new Button().setFontSize(CONFIG.fontSize).setText("+");
        const addS = new Button().setFontSize(CONFIG.fontSize).setText("+");
        const addPanel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(addH, 1)
            .addChild(addM, 1)
            .addChild(addS, 1);
        addH.onClicked.add(() => {
            hours = (hours + 1) % 100;
            updateValue();
        });
        addM.onClicked.add(() => {
            minutes = (minutes + 1) % 60;
            updateValue();
        });
        addS.onClicked.add(() => {
            seconds = (seconds + 1) % 60;
            updateValue();
        });

        const subH = new Button().setFontSize(CONFIG.fontSize).setText("-");
        const subM = new Button().setFontSize(CONFIG.fontSize).setText("-");
        const subS = new Button().setFontSize(CONFIG.fontSize).setText("-");
        const subPanel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(subH, 1)
            .addChild(subM, 1)
            .addChild(subS, 1);
        subH.onClicked.add(() => {
            hours = (hours + 99) % 100;
            updateValue();
        });
        subM.onClicked.add(() => {
            minutes = (minutes + 59) % 60;
            updateValue();
        });
        subS.onClicked.add(() => {
            seconds = (seconds + 59) % 60;
            updateValue();
        });

        const countDownCheckbox = new CheckBox()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("timer.countdown"));
        countDownCheckbox.setIsChecked(this._countdownFromSeconds > 0);

        const startButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.start"));
        startButton.onClicked.add(
            ThrottleClickHandler.wrap((button, player) => {
                this._obj.removeUIElement(this._editUI);
                this._editUI = undefined;

                const totalSeconds = hours * 3600 + minutes * 60 + seconds;
                if (countDownCheckbox.isChecked()) {
                    this.startCountdown(totalSeconds);
                } else {
                    this.startCountup(totalSeconds);
                }
            })
        );

        const cancelButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.cancel"));
        cancelButton.onClicked.add(
            ThrottleClickHandler.wrap((button, player) => {
                this._obj.removeUIElement(this._editUI);
                this._editUI = undefined;
            })
        );

        const panel = new VerticalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(addPanel)
            .addChild(value)
            .addChild(subPanel)
            .addChild(countDownCheckbox)
            .addChild(startButton)
            .addChild(cancelButton);

        const pad = CONFIG.spacing;
        const padded = new LayoutBox()
            .setPadding(pad, pad, pad, pad)
            .setMinimumWidth(200 * CONFIG.scale)
            .setChild(panel);

        const border = new Border().setChild(padded);

        this._editUI = new UIElement();
        this._editUI.position = new Vector(0, 0, 3);
        this._editUI.scale = 1 / CONFIG.scale;
        this._editUI.widget = border;

        this._obj.addUI(this._editUI);
    }
}

const timer = new Timer(refObject);
refObject.__timer = timer;
