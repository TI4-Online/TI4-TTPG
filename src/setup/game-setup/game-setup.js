const assert = require("../../wrapper/assert-wrapper");
const { ApplyScoreboard } = require("./apply-scoreboard");
const {
    GlobalSavedData,
    GLOBAL_SAVED_DATA_KEY,
} = require("../../lib/global-saved-data");
const { GameSetupUI } = require("./game-setup-ui");
const { globalEvents, world } = require("../../wrapper/api");

const _state = {
    gamePoints: 10,
    usePoK: true,
    useCodex1: true,
    useCodex2: true,
    timestamp: 0,
};
let _ui = false;

function onPlayerCountChanged(slider, player, value) {
    world.TI4.setPlayerCount(value, player);
}

function onGamePointsChanged(slider, player, value) {
    _state.gamePoints = value;
    new ApplyScoreboard().apply(value);
}

function onUsePokChanged(checkBox, player, isChecked) {
    assert(typeof isChecked === "boolean");
    _state.usePoK = isChecked;
}

function onUseCodex1Changed(checkBox, player, isChecked) {
    assert(typeof isChecked === "boolean");
    _state.useCodex1 = isChecked;
}

function onUseCodex2Changed(checkBox, player, isChecked) {
    assert(typeof isChecked === "boolean");
    _state.useCodex2 = isChecked;
}

function onSetupClicked(button, player) {
    // Record setup timestamp for gamedata.
    _state.timestamp = Date.now() / 1000;

    // Store the rest as-is.
    GlobalSavedData.set(GLOBAL_SAVED_DATA_KEY.SETUP_STATE, _state);

    // Tell world setup happened.
    globalEvents.TI4.onGameSetup.trigger(this._state, player);

    world.removeUI(_ui);
    _ui = false;
}

if (!world.__isMock) {
    process.nextTick(() => {
        if (world.TI4.getSetupTimestamp() > 0) {
            return;
        }
        _ui = new GameSetupUI(_state, {
            onPlayerCountChanged,
            onGamePointsChanged,
            onUsePokChanged,
            onUseCodex1Changed,
            onUseCodex2Changed,
            onSetupClicked,
        }).create();
        world.addUI(_ui);
    });
}
