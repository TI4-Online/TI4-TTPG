const assert = require("../wrapper/assert-wrapper");
const locale = require("../lib/locale");
const { ColorUtil } = require("../lib/color/color-util");
const { ObjectSavedData } = require("../lib/saved-data/object-saved-data");
const {
    Button,
    GameObject,
    UIElement,
    Vector,
    globalEvents,
    refObject,
    refPackageId,
    world,
} = require("../wrapper/api");
const { Broadcast } = require("../lib/broadcast");

const KEY_VALUE = "value";
const KEY_COUNTDOWN = "countdown";
const KEY_ACTIVE = "active";

class Timer {
    constructor(gameObject) {
        assert(gameObject instanceof GameObject);

        this._obj = gameObject;
        this._periodicHandler = undefined;

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

        const scale = 2;
        const z = gameObject.getExtent().z + 0.01;
        assert(typeof z === "number");

        this._timerWidget = new Button()
            .setFont("VT323-Regular.ttf", refPackageId)
            .setFontSize(36 * scale)
            .setTextColor(ColorUtil.colorFromHex("#cb0000"))
            .setText("00:00:00");

        this._timerWidget.onClicked.add((button, player) => {
            this._toggleTimer();
        });

        const ui = new UIElement();
        ui.position = new Vector(0, 0, z);
        ui.scale = 1 / scale;
        ui.widget = this._timerWidget;

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
}

const timer = new Timer(refObject);
refObject.__timer = timer;
