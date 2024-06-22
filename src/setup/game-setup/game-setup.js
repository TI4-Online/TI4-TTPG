const assert = require("../../wrapper/assert-wrapper");
const { ApplyScoreboard } = require("./apply-scoreboard");
const { GameSetupUI } = require("./game-setup-ui");
const { Hex } = require("../../lib/hex");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { ReplaceObjects } = require("../spawn/replace-objects");
const { RestrictObjects } = require("../spawn/restrict-objects");
const { SetupGenericHomeSystems } = require("../setup-generic-home-systems");
const { globalEvents, world } = require("../../wrapper/api");
const { TableColor } = require("../../lib/display/table-color");
const { HomebrewLoader } = require("../../lib/homebrew/homebrew-loader");
const { SetupEvents } = require("../../lib/event/setup-events");

let _useGameData = true;

let _pendingPlayerCountChange = undefined;

function onPlayerCountChanged(slider, player, value) {
    if (value === world.TI4.config.playerCount) {
        return;
    }

    // Watch out for a player count change race.
    // Lock out the controls until done.
    // PlayerDesk onPlayerCountChanged will re-enable.
    GameSetupUI.disablePlayerCountSlider();

    // If one still sneaks in, cancel pending.
    if (_pendingPlayerCountChange) {
        clearTimeout(_pendingPlayerCountChange);
        _pendingPlayerCountChange = undefined;
    }

    // Wait a moment before commiting (so a later one can cancel).
    const delayed = () => {
        _pendingPlayerCountChange = undefined;
        world.TI4.turns.invalidate();
        world.TI4.config.setPlayerCount(value, player);
    };
    _pendingPlayerCountChange = setTimeout(delayed, 1000);
}

function onGamePointsChanged(slider, player, value) {
    world.TI4.config.setGamePoints(value);
    ApplyScoreboard.resetPositionAndOrientation(value);
    ApplyScoreboard.resetScorableUI(value);
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
function onUseGeekMadnessChanged(checkbox, player, isChecked) {
    assert(typeof isChecked === "boolean");
    world.TI4.config.setGeekMadness(isChecked);
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
    console.log("GameSetup: onGameSetupPending");
    globalEvents.TI4.onGameSetupPending.trigger(this._state, player);

    const finishSetup = () => {
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
        console.log("GameSetup: onGameSetup");
        globalEvents.TI4.onGameSetup.trigger(this._state, player);

        // Kick off game data.
        if (_useGameData) {
            world.TI4.gameData.enable();
        }

        if (world.TI4.config.geekMadness) {
            SetupEvents.setup();
        }
    };
    process.nextTick(finishSetup);
}

function onDarkTableChanged(checkbox, player, isChecked) {
    if (isChecked) {
        TableColor.resetToDark();
    } else {
        TableColor.resetToDefaults();
    }
}

function onConfigHomebrew(button, player) {
    const success = HomebrewLoader.getInstance().reset();

    if (success) {
        // Give reset a chance to run the homebrew/registry.js script.
        process.nextTick(() => {
            HomebrewLoader.getInstance().createAndAddUI();
        });
    }
}

class GameSetup {
    constructor() {
        assert(world.TI4.config.timestamp <= 0);
        this._ui = new GameSetupUI({
            onPlayerCountChanged,
            onGamePointsChanged,
            onReportErrorsChanged,
            onDarkTableChanged,
            onUseLargerHexes,
            onUsePokChanged,
            onUseCodex1Changed,
            onUseCodex2Changed,
            onUseCodex3Changed,
            onUseCodex4Changed,
            onUseBaseMagenChanged,
            onUseGeekMadnessChanged,
            onUseGameDataChanged,
            onConfigHomebrew,
            onSetupClicked,
        }).create(_useGameData);
    }
    getUI() {
        return this._ui;
    }
}

module.exports = { GameSetup };
