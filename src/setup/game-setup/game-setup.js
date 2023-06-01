const assert = require("../../wrapper/assert-wrapper");
const { ApplyScoreboard } = require("./apply-scoreboard");
const { GameSetupUI } = require("./game-setup-ui");
const { Hex } = require("../../lib/hex");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { ReplaceObjects } = require("../spawn/replace-objects");
const { RestrictObjects } = require("../spawn/restrict-objects");
const { SetupGenericHomeSystems } = require("../setup-generic-home-systems");
const { globalEvents, world } = require("../../wrapper/api");

let _useGameData = true;

function onPlayerCountChanged(slider, player, value) {
    world.TI4.turns.invalidate();
    world.TI4.config.setPlayerCount(value, player);
}

function onGamePointsChanged(slider, player, value) {
    world.TI4.config.setGamePoints(value);
    new ApplyScoreboard().apply(value);
}

function onUsePokChanged(checkBox, player, isChecked) {
    assert(typeof isChecked === "boolean");
    world.TI4.config.setPoK(isChecked);
}

function onUseCodex1Changed(checkBox, player, isChecked) {
    assert(typeof isChecked === "boolean");
    world.TI4.config.setCodex1(isChecked);
}
function onUseCodex2Changed(checkBox, player, isChecked) {
    assert(typeof isChecked === "boolean");
    world.TI4.config.setCodex2(isChecked);
}
function onUseCodex3Changed(checkBox, player, isChecked) {
    assert(typeof isChecked === "boolean");
    world.TI4.config.setCodex3(isChecked);
}
function onUseCodex4Changed(checkBox, player, isChecked) {
    assert(typeof isChecked === "boolean");
    world.TI4.config.setCodex4(isChecked);
}

function onUseBaseMagenChanged(checkbox, player, isChecked) {
    assert(typeof isChecked === "boolean");
    world.TI4.config.setBaseMagen(isChecked);
}

function onUseGameDataChanged(checkBox, player, isChecked) {
    assert(typeof isChecked === "boolean");
    _useGameData = isChecked;
}

function onReportErrorsChanged(checkBox, player, isChecked) {
    assert(typeof isChecked === "boolean");
    world.TI4.config.setReportErrors(isChecked);
}

function onUseLargerHexes(checkBox, player, isChecked) {
    assert(typeof isChecked === "boolean");

    Hex.setLargerScale(isChecked);

    // Resize any existing system tiles.
    const scale = Hex.SCALE * 0.995;
    for (const obj of world.getAllObjects()) {
        if (ObjectNamespace.isSystemTile(obj)) {
            obj.setScale([scale, scale, scale]);
        }
    }

    // Redo generic HS placement.  Nothing else should care at this point.
    world.TI4.getAllPlayerDesks().forEach((playerDesk) => {
        const setup = new SetupGenericHomeSystems(playerDesk);
        setup.clean();
        setup.setup();
    });
}

function onSetupClicked(button, player) {
    // Record setup timestamp for gamedata.
    const timestamp = Date.now() / 1000;
    world.TI4.config.setTimestamp(timestamp);

    let removedCount = 0;

    // Apply other restrictions.  Do first in case replacements also apply.
    removedCount += RestrictObjects.removeRestrictObjects();

    // Apply omega.  This one verifies replacement exists.
    removedCount += ReplaceObjects.removeReplacedObjects();

    console.log(`GameSetup: removed ${removedCount} objects`);

    // Tell world setup happened.
    globalEvents.TI4.onGameSetup.trigger(this._state, player);

    // Kick off game data.
    if (_useGameData) {
        world.TI4.gameData.enable();
    }
}

class GameSetup {
    constructor() {
        assert(world.TI4.config.timestamp <= 0);
        this._ui = new GameSetupUI({
            onPlayerCountChanged,
            onGamePointsChanged,
            onReportErrorsChanged,
            onUseLargerHexes,
            onUsePokChanged,
            onUseCodex1Changed,
            onUseCodex2Changed,
            onUseCodex3Changed,
            onUseCodex4Changed,
            onUseBaseMagenChanged,
            onUseGameDataChanged,
            onSetupClicked,
        }).create(_useGameData);
    }
    getUI() {
        return this._ui;
    }
}

module.exports = { GameSetup };
