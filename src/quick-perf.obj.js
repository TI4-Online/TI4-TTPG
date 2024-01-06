/**
 * Setup a table and objects with a consistent viewpoint for performance comparisons.
 */
const { MapTool } = require("./game-ui/tab-map/tab-map-tool/map-tool");
const { MapStringLoad } = require("./lib/map-string/map-string-load");
const { ObjectNamespace } = require("./lib/object-namespace");
const {
    SetupFactionAlliance,
} = require("./setup/faction/setup-faction-alliance");
const { SetupFactionExtra } = require("./setup/faction/setup-faction-extra");
const {
    SetupFactionLeaders,
} = require("./setup/faction/setup-faction-leaders");
const {
    SetupFactionPromissory,
} = require("./setup/faction/setup-faction-promissory");
const { SetupFactionSheet } = require("./setup/faction/setup-faction-sheet");
const { SetupFactionTech } = require("./setup/faction/setup-faction-tech");
const { SetupFactionTokens } = require("./setup/faction/setup-faction-tokens");
const { SetupHomeSystem } = require("./setup/faction/setup-home-system");
const { SetupStartingTech } = require("./setup/faction/setup-starting-tech");
const { SetupStartingUnits } = require("./setup/faction/setup-starting-units");
const { SetupCardHolders } = require("./setup/setup-card-holders");
const {
    SetupGenericHomeSystems,
} = require("./setup/setup-generic-home-systems");
const { SetupGenericPromissory } = require("./setup/setup-generic-promissory");
const { SetupGenericTech } = require("./setup/setup-generic-tech");
const { SetupPlayerMats } = require("./setup/setup-player-mats");
const { SetupQuickRollers } = require("./setup/setup-quick-rollers");
const { SetupSecretHolders } = require("./setup/setup-secret-holders");
const { SetupSheets } = require("./setup/setup-sheets");
const { SetupStatusPads } = require("./setup/setup-status-pads");
const { SetupStrategyCards } = require("./setup/setup-strategy-cards");
const { SetupSupplyBoxesDesks } = require("./setup/setup-supply-boxes-desks");
const { SetupSupplyBoxesTable } = require("./setup/setup-supply-boxes-table");
const { SetupSystemTiles } = require("./setup/setup-system-tiles");
const { SetupTableBoxes } = require("./setup/setup-table-boxes");
const { SetupTableDecks } = require("./setup/setup-table-decks");
const { SetupTableGraveyards } = require("./setup/setup-table-graveyards");
const { SetupTableMats } = require("./setup/setup-table-mats");
const { SetupTableTokens } = require("./setup/setup-table-tokens");
const { SetupTimer } = require("./setup/setup-timer");
const { SetupUnits } = require("./setup/setup-units");
const { ReplaceObjects } = require("./setup/spawn/replace-objects");
const { RestrictObjects } = require("./setup/spawn/restrict-objects");
const { Rotator, Vector, refObject, world } = require("./wrapper/api");

// Disable error reporting (rely on console).
world.TI4.config.setReportErrors(false);

// Set a setup timestamp ("game in progress")
world.TI4.config.setTimestamp(1);

// Move the player camera to a standard position.
for (const player of world.getAllPlayers()) {
    const pos = new Vector(-225, 0, 240);
    const rot = new Rotator(-50, 0, 0);
    player.setPositionAndRotation(pos, rot);
}

// DESTROY!
function destroyAll() {
    for (const obj of world.getAllObjects()) {
        if (obj !== refObject) {
            obj.setTags(["DELETED_ITEMS_IGNORE"]);
            obj.destroy();
        }
    }
    for (const label of world.getAllLabels()) {
        label.destroy();
    }
    for (const zone of world.getAllZones()) {
        zone.destroy();
    }
    for (const line of world.getDrawingLines()) {
        world.removeDrawingLineObject(line);
    }
}

// Setup initial table state.
let steps = [];
steps.push({
    label: "DESTROY",
    setup: destroyAll,
});
steps.push({
    label: "Desk and Game UI",
    setup: () => {}, // global
});
steps.push({
    label: "SetupTableMats",
    setup: () => {
        new SetupTableMats().setup(); // need mats early so things can spawn on them!
    },
});
steps.push({
    label: "SetupSecretHolders",
    setup: () => {
        new SetupSecretHolders().setup();
    },
});
steps.push({
    label: "SetupStrategyCards",
    setup: () => {
        new SetupStrategyCards().setup();
    },
});
steps.push({
    label: "SetupSupplyBoxesTable",
    setup: () => {
        new SetupSupplyBoxesTable().setup();
    },
});
steps.push({
    label: "SetupSystemTiles",
    setup: () => {
        new SetupSystemTiles().setup();
    },
});
steps.push({
    label: "SetupTableBoxes",
    setup: () => {
        new SetupTableBoxes().setup();
    },
});
steps.push({
    label: "SetupTableDecks",
    setup: () => {
        new SetupTableDecks().setup();
    },
});
steps.push({
    label: "SetupTableGraveyards",
    setup: () => {
        new SetupTableGraveyards().setup();
    },
});
steps.push({
    label: "SetupTableTokens",
    setup: () => {
        new SetupTableTokens().setup();
    },
});
steps.push({
    label: "SetupQuickRollers",
    setup: () => {
        new SetupQuickRollers().setup();
    },
});
steps.push({
    label: "SetupTimer",
    setup: () => {
        new SetupTimer().setup();
    },
});

// Per-desk generic.
const playerDesks = world.TI4.getAllPlayerDesks();
steps.push({
    label: "PlayerDesk.SetupCardHolders",
    setup: () => {
        for (const playerDesk of playerDesks) {
            new SetupCardHolders(playerDesk).setup();
        }
    },
});
steps.push({
    label: "PlayerDesk.SetupGenericHomeSystems",
    setup: () => {
        for (const playerDesk of playerDesks) {
            new SetupGenericHomeSystems(playerDesk).setup();
        }
    },
});
steps.push({
    label: "PlayerDesk.SetupGenericPromissory",
    setup: () => {
        for (const playerDesk of playerDesks) {
            new SetupGenericPromissory(playerDesk).setup();
        }
    },
});
steps.push({
    label: "PlayerDesk.SetupGenericTech",
    setup: () => {
        for (const playerDesk of playerDesks) {
            new SetupGenericTech(playerDesk).setup();
        }
    },
});
steps.push({
    label: "PlayerDesk.SetupPlayerMats",
    setup: () => {
        for (const playerDesk of playerDesks) {
            new SetupPlayerMats(playerDesk).setup();
        }
    },
});
steps.push({
    label: "PlayerDesk.SetupSupplyBoxesDesks",
    setup: () => {
        for (const playerDesk of playerDesks) {
            new SetupSupplyBoxesDesks(playerDesk).setup();
        }
    },
});
steps.push({
    label: "PlayerDesk.SetupSheets",
    setup: () => {
        for (const playerDesk of playerDesks) {
            new SetupSheets(playerDesk).setup();
        }
    },
});
steps.push({
    label: "PlayerDesk.SetupStatusPads",
    setup: () => {
        for (const playerDesk of playerDesks) {
            new SetupStatusPads(playerDesk).setup();
        }
    },
});
steps.push({
    label: "PlayerDesk.SetupUnits",
    setup: () => {
        for (const playerDesk of playerDesks) {
            new SetupUnits(playerDesk).setup();
        }
    },
});

// Apply replacement rules (use Codex over base cards, etc).
steps.push({
    label: "Restrict/replace objects",
    setup: () => {
        RestrictObjects.removeRestrictObjects();
        ReplaceObjects.removeReplacedObjects();
    },
});

// Setup a map.
steps.push({
    label: "MapStringLoad",
    setup: () => {
        // SCPT prelims 2021
        let mapString =
            "26 61 64 59 31 63 76 45 69 41 65 68 72 79 66 80 36 67 0 73 47 0 74 46 0 37 49 0 30 50 0 29 40 0 70 48";
        MapStringLoad.load(mapString);
    },
});

// Setup factions.
const factions = world.TI4.getAllFactions();
const playerDeskAndFaction = [];
for (let i = 0; i < playerDesks.length; i++) {
    const playerDesk = playerDesks[i];
    const faction = factions[i];
    playerDeskAndFaction.push({ playerDesk, faction });
}
steps.push({
    label: "PlayerDesk.SetupFactionAlliance",
    setup: () => {
        for (const { playerDesk, faction } of playerDeskAndFaction) {
            new SetupFactionAlliance(playerDesk, faction).setup();
        }
    },
});
steps.push({
    label: "PlayerDesk.SetupFactionExtra",
    setup: () => {
        for (const { playerDesk, faction } of playerDeskAndFaction) {
            new SetupFactionExtra(playerDesk, faction).setup();
        }
    },
});
steps.push({
    label: "PlayerDesk.SetupFactionLeaders",
    setup: () => {
        for (const { playerDesk, faction } of playerDeskAndFaction) {
            new SetupFactionLeaders(playerDesk, faction).setup();
        }
    },
});
steps.push({
    label: "PlayerDesk.SetupFactionPromissory",
    setup: () => {
        for (const { playerDesk, faction } of playerDeskAndFaction) {
            new SetupFactionPromissory(playerDesk, faction).setup();
        }
    },
});
steps.push({
    label: "PlayerDesk.SetupFactionSheet",
    setup: () => {
        for (const { playerDesk, faction } of playerDeskAndFaction) {
            new SetupFactionSheet(playerDesk, faction).setup();
        }
    },
});
steps.push({
    label: "PlayerDesk.SetupFactionTech",
    setup: () => {
        for (const { playerDesk, faction } of playerDeskAndFaction) {
            new SetupFactionTech(playerDesk, faction).setup();
        }
    },
});
steps.push({
    label: "PlayerDesk.SetupFactionTokens",
    setup: () => {
        for (const { playerDesk, faction } of playerDeskAndFaction) {
            new SetupFactionTokens(playerDesk, faction).setup();
        }
    },
});
steps.push({
    label: "PlayerDesk.SetupHomeSystem",
    setup: () => {
        for (const { playerDesk, faction } of playerDeskAndFaction) {
            new SetupHomeSystem(playerDesk, faction).setup();
        }
    },
});
steps.push({
    label: "PlayerDesk.SetupStartingTech",
    setup: () => {
        for (const { playerDesk, faction } of playerDeskAndFaction) {
            new SetupStartingTech(playerDesk, faction).setup();
        }
    },
});
steps.push({
    label: "PlayerDesk.SetupStartingUnits",
    setup: () => {
        for (const { playerDesk, faction } of playerDeskAndFaction) {
            new SetupStartingUnits(playerDesk, faction).setup();
        }
    },
});

// Finish map (planet cards, frontier tokens).
steps.push({
    label: "Map cards + frontier tokens",
    setup: () => {
        const mapTool = new MapTool();
        mapTool.placeCards();
        mapTool.placeFrontierTokens();
    },
});

// Testing: remove unit containers.
steps.push({
    label: "Remove unit containers",
    setup: () => {
        for (const obj of world.getAllObjects()) {
            if (ObjectNamespace.isUnitBag(obj) || ObjectNamespace.isUnit(obj)) {
                obj.setTags(["DELETED_ITEMS_IGNORE"]);
                obj.destroy();
            }
        }
    },
});

// XXX HACK JUST TEST UNITS
steps = [];
steps.push({
    label: "DESTROY",
    setup: destroyAll,
});
steps.push({
    label: "PlayerDesk.SetupUnits",
    setup: () => {
        for (const playerDesk of playerDesks) {
            new SetupUnits(playerDesk).setup();
        }
    },
});

const labelToDeltas = {};

const origSteps = [...steps];
const stepDelay = world.TI4.perfStats.getHistorySize() + 50;
let msgs = [];
let _lastLabel = undefined;
let _lastFPS = undefined;
let _ticksRemaining = stepDelay;

const setupNext = () => {
    if (_ticksRemaining-- > 0) {
        process.nextTick(setupNext);
        return;
    }
    _ticksRemaining = stepDelay;

    const fps = world.TI4.perfStats.summarize().fps;
    if (_lastLabel) {
        const deltaFPS = _lastFPS ? _lastFPS - fps : 0;
        const msg = `${deltaFPS.toFixed(2)} STEP "${_lastLabel}": ${fps.toFixed(
            2
        )}`;
        console.log(msg);
        msgs.push(msg);

        let deltas = labelToDeltas[_lastLabel];
        if (!deltas) {
            deltas = [];
            labelToDeltas[_lastLabel] = deltas;
        }
        deltas.push(deltaFPS);
    }

    const step = steps.shift();
    if (step) {
        _lastLabel = step.label;
        _lastFPS = fps;

        //console.log(`step ${step.label}`);
        step.setup();

        process.nextTick(setupNext);
    } else {
        console.log(`FINISHED\n${msgs.join("#")}`);

        const summary = [];
        for (let [label, deltas] of Object.entries(labelToDeltas)) {
            let min = Number.MAX_SAFE_INTEGER;
            let max = Number.MIN_SAFE_INTEGER;
            let total = 0;
            for (const delta of deltas) {
                min = Math.min(min, delta);
                max = Math.max(max, delta);
                total += delta;
            }
            const delta = total / deltas.length;
            deltas.sort();
            deltas = deltas.map((delta) => delta.toFixed(1));
            summary.push(`${delta.toFixed(2)} ${label} [${deltas.join(", ")}]`);
        }
        const msg = "AVG\n" + summary.join("#");
        console.log(msg);

        // Go again!
        msgs = [];
        steps.push(...origSteps);
        process.nextTick(setupNext);
    }
};
setTimeout(setupNext, 1000);
