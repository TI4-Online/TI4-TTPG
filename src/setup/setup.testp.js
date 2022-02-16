const { PlayerDesk } = require("../lib/player-desk");
const { SetupFaction } = require("./setup-faction");
const { SetupGenericPromissory } = require("./setup-generic-promissory");
const { SetupGenericTech } = require("./setup-generic-tech");
const { SetupHands } = require("./setup-hands");
const { SetupSheets } = require("./setup-sheets");
const { SetupStrategyCards } = require("./setup-strategy-cards");
const { SetupSupplyBoxes } = require("./setup-supply-boxes");
const { SetupSystemTiles } = require("./setup-system-tiles");
const { SetupTableDecks } = require("./setup-table-decks");
const { SetupTableTokens } = require("./setup-table-tokens");
const { SetupUnits } = require("./setup-units");
const { MapStringLoad } = require("../lib/map-string/map-string-load");
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
    TABLE_DECKS: "*Table decks",
    TABLE_TOKENS: "*Table tokens",
    STRATEGY_CARDS: "*Strategy cards",
    DEMO_MAP: "*Demo map",
    DEMO_FACTION: "*Demo faction",
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
        console.log(player.getPosition());
        console.log(player.getRotation());
        PlayerDesk.drawDebug();
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
            setups.push(new SetupSupplyBoxes(playerDesk));
        }
    } else if (actionName === ACTION.SHEETS) {
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            setups.push(new SetupSheets(playerDesk));
        }
    } else if (actionName === ACTION.HANDS) {
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            setups.push(new SetupHands(playerDesk));
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
    } else if (actionName === ACTION.TABLE_DECKS) {
        setups.push(new SetupTableDecks());
    } else if (actionName === ACTION.TABLE_TOKENS) {
        setups.push(new SetupTableTokens());
    } else if (actionName === ACTION.STRATEGY_CARDS) {
        setups.push(new SetupStrategyCards());
    } else if (actionName === ACTION.DEMO_MAP) {
        MapStringLoad.load(
            "70 32 50 47 42 73 74 65 48 69 71 64 78 36 26 66 77 72 1 46 79 2 27 45 3 24 29 4 62 37 5 41 38 6 43 40"
        );
    } else if (actionName === ACTION.DEMO_FACTION) {
        const factions = [
            "ul",
            "arborec",
            "creuss",
            "muaat",
            "nekro",
            "argent",
            "vuilraith",
            "winnu",
        ];
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            new SetupFaction(playerDesk, factions.shift()).setup();
        }
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
