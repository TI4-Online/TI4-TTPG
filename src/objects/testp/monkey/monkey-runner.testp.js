const assert = require("../../../wrapper/assert-wrapper");
const { MonkeyEvent } = require("./monkey-event");
const { MonkeyUtil } = require("./monkey-util");
const { GameObject, refObject, world } = require("../../../wrapper/api");

const INTERVAL_DELAY_MSECS = 100;

assert(MonkeyEvent);
const MONKEY_ACTIONS = [
    MonkeyEvent.globalUiClick, // REQUIRES GLOBAL.JS MONKEY-INTERPOSE
    MonkeyEvent.objectUiClick, // REQUIRES GLOBAL.JS MONKEY-INTERPOSE
    MonkeyEvent.dealAndReplaceActionCard,
    MonkeyEvent.placeAndReplaceUnit,
    MonkeyEvent.activateSystem,
];

const CUSTOM_ACTIONS = {
    START: { name: "*Start Monkey", tooltip: "Do random things" },
    STOP: { name: "*Stop Monkey" },
};

class MonkeyRunner {
    constructor(gameObject) {
        assert(gameObject instanceof GameObject);

        this._intevalHandle = undefined;

        for (const action of Object.values(CUSTOM_ACTIONS)) {
            gameObject.addCustomAction(action.name, action.tooltip);
        }
        gameObject.onCustomAction.add((obj, player, actionName) => {
            if (actionName === CUSTOM_ACTIONS.START.name) {
                this._start();
            } else if (actionName === CUSTOM_ACTIONS.STOP.name) {
                this._stop();
            } else {
                throw new Error(`unknown action "${actionName}"`);
            }
        });
    }

    _start() {
        this._stop();
        this._intevalHandle = setInterval(() => {
            this._monkey();
        }, INTERVAL_DELAY_MSECS);
    }

    _stop() {
        if (this._intevalHandle) {
            clearInterval(this._intevalHandle);
            this._intevalHandle = undefined;
        }
    }

    _monkey() {
        const monkeyAction = MonkeyUtil.randomFrom(MONKEY_ACTIONS);
        if (monkeyAction) {
            monkeyAction();
        }
    }
}

let _createOnlyOnceCalled = false;
const createOnlyOnce = (obj) => {
    assert(obj instanceof GameObject);
    if (_createOnlyOnceCalled || world.__isMock) {
        return;
    }
    _createOnlyOnceCalled = true;
    new MonkeyRunner(obj);
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
