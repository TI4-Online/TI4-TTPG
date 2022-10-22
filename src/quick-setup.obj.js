/**
 * Quickly set up an empty table.
 */

const { GlobalSavedData } = require("./lib/saved-data/global-saved-data");
const { Hex } = require("./lib/hex");
const { PlayerDeskSetup } = require("./lib/player-desk/player-desk-setup");
const { SetupQuickRollers } = require("./setup/setup-quick-rollers");
const { SetupSecretHolders } = require("./setup/setup-secret-holders");
const { SetupStrategyCards } = require("./setup/setup-strategy-cards");
const { SetupSupplyBoxesTable } = require("./setup/setup-supply-boxes-table");
const { SetupSystemTiles } = require("./setup/setup-system-tiles");
const { SetupTableBoxes } = require("./setup/setup-table-boxes");
const { SetupTableDecks } = require("./setup/setup-table-decks");
const { SetupTableGraveyards } = require("./setup/setup-table-graveyards");
const { SetupTableMats } = require("./setup/setup-table-mats");
const { SetupTableTokens } = require("./setup/setup-table-tokens");
const { SetupTimer } = require("./setup/setup-timer");
const { TableLayout } = require("./table/table-layout");
const { refObject, world } = require("./wrapper/api");

const ACTION = {
    CLEAN: "*CLEAN",
    SETUP: "*SETUP",
    OCTO_TABLE: "*OCTO TABLE",
    SIX_SKINNY: "*6P SKINNY",
};

function clean(preserveTable) {
    for (const obj of world.getAllObjects()) {
        if (obj !== refObject) {
            obj.destroy();
        }
    }

    const tableValue = TableLayout.GET_TABLE();
    GlobalSavedData.clear();
    if (preserveTable) {
        TableLayout.SET_TABLE(tableValue);
    }

    // Hex keeps some in-memory state.  Reset it.
    Hex.setLargerScale(Hex.getLargerScale());
}

for (const action of Object.values(ACTION)) {
    refObject.addCustomAction(action);
}

refObject.onCustomAction.add((obj, player, actionName) => {
    console.log(`${player.getName()} selected ${actionName}`);

    if (actionName === ACTION.CLEAN) {
        clean();
        world.resetScripting();
    }

    if (actionName === ACTION.SETUP) {
        clean(true);

        const setups = [];

        // Duck-typed "setup"  for player desks.  Use the same setup as
        // changing player count does.
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            setups.push({
                setup: () => {
                    new PlayerDeskSetup(playerDesk).setupGeneric();
                },
            });
        }
        // Need mats before things that spawn on top of them.
        setups.push(new SetupTableMats());

        // Now the rest.
        setups.push(new SetupSecretHolders());
        setups.push(new SetupStrategyCards());
        setups.push(new SetupSupplyBoxesTable());
        setups.push(new SetupSystemTiles());
        setups.push(new SetupTableBoxes());
        setups.push(new SetupTableDecks());
        setups.push(new SetupTableGraveyards());
        setups.push(new SetupTableTokens());
        setups.push(new SetupQuickRollers());
        setups.push(new SetupTimer());

        const setupNext = () => {
            const setup = setups.shift();
            if (!setup) {
                console.log(`World #objects = ${world.getAllObjects().length}`);
                world.resetScripting();
                return;
            }
            setup.setup();
            process.nextTick(setupNext);
        };
        process.nextTick(setupNext);
    }

    if (actionName === ACTION.OCTO_TABLE) {
        clean();
        TableLayout.SET_TABLE("layout-v5-oct");
    }
    if (actionName === ACTION.SIX_SKINNY) {
        clean();
        TableLayout.SET_TABLE("6p-skinny");
    }
});
