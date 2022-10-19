const assert = require("../wrapper/assert-wrapper");
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
const { ColorUtil } = require("../lib/color/color-util");
const { ObjectSavedData } = require("../lib/saved-data/object-saved-data");

const SECONDS_KEY = "seconds";

class Timer {
    constructor(gameObject) {
        assert(gameObject instanceof GameObject);

        this._obj = gameObject;
        this._periodicHandler = undefined;
        this._value = Number.parseInt(
            ObjectSavedData.get(this._obj, SECONDS_KEY, "0")
        );
        this._lastSaveValue = this._value;

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
        this._update(0);
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
        this._periodicHandler = setInterval(() => {
            this._update(1);
        }, 1000);
    }

    _stopTimer() {
        console.log("Timer._stopTimer");

        if (this._periodicHandler) {
            clearInterval(this._periodicHandler);
            this._periodicHandler = undefined;
        }
    }

    _update(incrementBySeconds) {
        assert(typeof incrementBySeconds === "number");
        this._value += incrementBySeconds;

        if (this._value > this._lastSaveValue + 10) {
            ObjectSavedData.set(this._obj, SECONDS_KEY, String(this._value));
        }

        let hours = Math.floor(this._value / 3600);
        let minutes = Math.floor((this._value % 3600) / 60);
        let seconds = Math.floor(this._value % 60);

        hours = String(hours).padStart(2, "0");
        minutes = String(minutes).padStart(2, "0");
        seconds = String(seconds).padStart(2, "0");

        const text = `${hours}:${minutes}:${seconds}`;
        this._timerWidget.setText(text);
    }
}

let _createOnlyOnceCalled = false;
const createOnlyOnce = (obj) => {
    assert(obj instanceof GameObject);
    if (_createOnlyOnceCalled) {
        return;
    }
    _createOnlyOnceCalled = true;
    new Timer(obj);
};

refObject.onCreated.add((obj) => {
    // DO NOT CREATE UI IN ONCREATED CALLBACK, IT WILL LINGER ACROSS RELOAD
    // AND PROBABLY CAUSES OTHER PROBLEMS.
    process.nextTick(() => {
        createOnlyOnce(obj);
    });
});

if (world.getExecutionReason() === "ScriptReload") {
    process.nextTick(() => {
        createOnlyOnce(refObject);
    });
}
