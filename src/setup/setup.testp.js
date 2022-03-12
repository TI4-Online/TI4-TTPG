const { SetupGenericPromissory } = require("./setup-generic-promissory");
const { SetupGenericTech } = require("./setup-generic-tech");
const { SetupCardHolders } = require("./setup-card-holders");
const { SetupSecretHolders } = require("./setup-secret-holders");
const { SetupSheets } = require("./setup-sheets");
const { SetupStrategyCards } = require("./setup-strategy-cards");
const { SetupSupplyBoxesDesks } = require("./setup-supply-boxes-desks");
const { SetupSystemTiles } = require("./setup-system-tiles");
const { SetupTableDecks } = require("./setup-table-decks");
const { SetupTableGraveyards } = require("./setup-table-graveyards");
const { SetupTableMats } = require("./setup-table-mats");
const { SetupTableTokens } = require("./setup-table-tokens");
const { SetupUnits } = require("./setup-units");
const { MapStringLoad } = require("../lib/map-string/map-string-load");
const { PhaseUI } = require("../lib/phase/phase-ui");
const { globalEvents, refObject, world } = require("@tabletop-playground/api");

const ACTION = {
    GIZMO_DESKS: "*Gizmo desks",
    COUNT_OBJECTS: "*Count objects",
    CLEAN: "*CLEAN ALL",
    UNITS: "*Units",
    SUPPLY: "*Supply",
    SHEETS: "*Sheets",
    HANDS: "*Hands",
    GENERIC_TECH: "*Generic tech",
    GENERIC_PROMISSORY: "*Generic promissory",
    SYSTEM_TILES: "*System tiles",
    TABLE_MATS: "*Table mats",
    SECRET_HOLDERS: "*Secret holders",
    TABLE_DECKS: "*Table decks",
    TABLE_TOKENS: "*Table tokens",
    TABLE_GRAVEYARDS: "*Table graveyards",
    STRATEGY_CARDS: "*Strategy cards",
    DEMO_MAP: "*Demo map",
    PHASE_UI: "*Phase UI",
};

let _isSetupMode = true;

for (const action of Object.values(ACTION)) {
    refObject.addCustomAction(action);
}

refObject.onCustomAction.add((obj, player, actionName) => {
    console.log(`${player.getName()} selected ${actionName}`);
    console.log(`isDown: ${player.isScriptKeyDown(10)}`);

    const setups = [];

    if (actionName === ACTION.GIZMO_DESKS) {
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            playerDesk.drawDebug();
        }
    } else if (actionName === ACTION.COUNT_OBJECTS) {
        console.log(`World #objects = ${world.getAllObjects().length}`);
    } else if (actionName === ACTION.CLEAN) {
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer() || obj == refObject) {
                continue;
            }
            obj.destroy();
        }
    } else if (actionName === ACTION.UNITS) {
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            setups.push(new SetupUnits(playerDesk));
        }
    } else if (actionName === ACTION.SUPPLY) {
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            setups.push(new SetupSupplyBoxesDesks(playerDesk));
        }
    } else if (actionName === ACTION.SHEETS) {
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            setups.push(new SetupSheets(playerDesk));
        }
    } else if (actionName === ACTION.HANDS) {
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            setups.push(new SetupCardHolders(playerDesk));
        }
    } else if (actionName === ACTION.GENERIC_TECH) {
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            setups.push(new SetupGenericTech(playerDesk));
        }
    } else if (actionName === ACTION.GENERIC_PROMISSORY) {
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            setups.push(new SetupGenericPromissory(playerDesk));
        }
    } else if (actionName === ACTION.SYSTEM_TILES) {
        setups.push(new SetupSystemTiles());
    } else if (actionName === ACTION.TABLE_MATS) {
        setups.push(new SetupTableMats());
    } else if (actionName === ACTION.SECRET_HOLDERS) {
        setups.push(new SetupSecretHolders());
    } else if (actionName === ACTION.TABLE_DECKS) {
        setups.push(new SetupTableDecks());
    } else if (actionName === ACTION.TABLE_GRAVEYARDS) {
        setups.push(new SetupTableGraveyards());
    } else if (actionName === ACTION.TABLE_TOKENS) {
        setups.push(new SetupTableTokens());
    } else if (actionName === ACTION.STRATEGY_CARDS) {
        setups.push(new SetupStrategyCards());
    } else if (actionName === ACTION.DEMO_MAP) {
        MapStringLoad.load(
            "70 32 50 47 42 73 74 65 48 69 71 64 78 36 26 66 77 72 0 46 79 0 27 45 0 24 29 0 62 37 0 41 38 0 43 40"
        );
    } else if (actionName === ACTION.PHASE_UI) {
        const ui = new PhaseUI().create();
        world.addUI(ui);
    }

    console.log(`_isSetupMode = ${_isSetupMode}`);
    for (const setup of setups) {
        if (_isSetupMode) {
            setup.setup();
        } else {
            setup.clean();
        }
    }
});

globalEvents.onScriptButtonPressed.add((player, index) => {
    console.log(`onScriptButtonPressed: ${index}`);
    if (index === 10) {
        _isSetupMode = !_isSetupMode;
        console.log(`toggling _isSetupMode to ${_isSetupMode}`);
    }
});
