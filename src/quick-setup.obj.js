/**
 * Quickly set up an empty table.
 */

const { GlobalSavedData } = require("./lib/saved-data/global-saved-data");
const { PlayerDeskSetup } = require("./lib/player-desk/player-desk-setup");
const { SetupSecretHolders } = require("./setup/setup-secret-holders");
const { SetupStrategyCards } = require("./setup/setup-strategy-cards");
const { SetupSystemTiles } = require("./setup/setup-system-tiles");
const { SetupTableBoxes } = require("./setup/setup-table-boxes");
const { SetupTableDecks } = require("./setup/setup-table-decks");
const { SetupTableGraveyards } = require("./setup/setup-table-graveyards");
const { SetupTableMats } = require("./setup/setup-table-mats");
const { SetupTableTokens } = require("./setup/setup-table-tokens");
const { refObject, world } = require("./wrapper/api");

const ACTION = {
    CLEAN: "*CLEAN",
    SETUP: "*SETUP",
};

for (const action of Object.values(ACTION)) {
    refObject.addCustomAction(action);
}

refObject.onCustomAction.add((obj, player, actionName) => {
    console.log(`${player.getName()} selected ${actionName}`);

    if (actionName === ACTION.CLEAN) {
        for (const obj of world.getAllObjects()) {
            if (obj !== refObject) {
                obj.destroy();
            }
        }
        GlobalSavedData.clear();
    }

    if (actionName === ACTION.SETUP) {
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
        setups.push(new SetupSystemTiles());
        setups.push(new SetupTableBoxes());
        setups.push(new SetupTableDecks());
        setups.push(new SetupTableGraveyards());
        setups.push(new SetupTableTokens());

        const setupNext = () => {
            const setup = setups.shift();
            if (!setup) {
                console.log(`World #objects = ${world.getAllObjects().length}`);
                return;
            }
            setup.setup();
            process.nextTick(setupNext);
        };
        process.nextTick(setupNext);
    }
});
