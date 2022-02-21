const TriggerableMulticastDelegate = require("./lib/triggerable-multicast-delegate");
const { globalEvents, world } = require("./wrapper/api");

// Create global events delegates BEFORE loading other global scripts.
globalEvents.TI4 = {
    // Called when container rejects an added object.
    // Object is still inside container when this event fires, handlers should
    // verify object.getContainer matches in case multiple act on it.
    // <(container: Container, rejectedObjects: Array.{GameObject}, player: Player) => void>
    onContainerRejected: new TriggerableMulticastDelegate(),

    // Called after a player unpacks (or re-packs!) a faction.
    // Note the the "player" is the player who clicked the button, they
    // might not be seated at the given desk.
    // <(deskPlayerSlot: number, player: Player|undefined) => void>
    onFactionChanged: new TriggerableMulticastDelegate(),

    // Called after a player clicks the initial game "setup" button.
    // <(state: object, player: Player) => void>
    onGameSetup: new TriggerableMulticastDelegate(),

    // Called after the player count changes (setup not finished).
    // <(playerCount: number, player: Player|undefined) => void>
    onPlayerCountChanged: new TriggerableMulticastDelegate(),

    // Called when the active player dropped a command token on a system.
    // <(systemTile: GameObject, player: Player) => void>
    onSystemActivated: new TriggerableMulticastDelegate(),

    // Called when a Strategy Card is Played
    // <(strategyCard: GameObject, player: Player) => void>
    onStrategyCardPlayed: new TriggerableMulticastDelegate(),

    // Called when a Strategy Card selection is done by a player
    // <(object: card, player:Player) => void>
    onStrategyCardSelectionDone: new TriggerableMulticastDelegate(),
};

require("./global/numpad-actions");
require("./global/on-container-rejected");
require("./global/patch-infinite-container");
require("./global/patch-exclusive-bags");
require("./global/r-swap-split-combine");
require("./global/strategy-card-functions");
require("./global/trigger-on-system-activated");

// Player desk is naughty and wants to register global event listeners.
const { PlayerDesk } = require("./lib/player-desk");

// Show setup ui.
require("./setup/game-setup/game-setup");
if (!world.__isMock) {
    console.log("Welcome to Twilight Imperium IV");
}

const { Faction } = require("./lib/faction/faction");
const { GameSetupConfig } = require("./setup/game-setup/game-setup-config");
const { GlobalSavedData } = require("./lib/global-saved-data");
const { System, Planet } = require("./lib/system/system");

// Register some functions in world to reduce require dependencies.
world.TI4 = {
    config: new GameSetupConfig(),

    getActiveSystemTileObject: () => {
        return System.getActiveSystemTileObject();
    },

    getAllFactions: () => {
        return Faction.getAllFactions();
    },
    getAllPlayerDesks: () => {
        return PlayerDesk.getAllPlayerDesks();
    },
    getAllSystemTileObjects: () => {
        return System.getAllSystemTileObjects();
    },

    getClosestPlayerDesk: (pos) => {
        return PlayerDesk.getClosest(pos);
    },

    getFactionByNsidName: (nsidName) => {
        return Faction.getByNsidName(nsidName);
    },
    getFactionByPlayerSlot: (playerSlot) => {
        return Faction.getByPlayerSlot(playerSlot);
    },
    getPlanetByCard: (card) => {
        return Planet.getByCard(card);
    },
    getPlanetByCardNsid: (nsid) => {
        return Planet.getByCardNsid(nsid);
    },
    getSystemBySystemTileObject: (gameObject) => {
        return System.getBySystemTileObject(gameObject);
    },
    getSystemByTileNumber: (tileNumber) => {
        return System.getByTileNumber(tileNumber);
    },
    getSystemTileObjectByPosition: (pos) => {
        return System.getSystemTileObjectByPosition(pos);
    },

    reset: () => {
        GlobalSavedData.clear();
        world.resetScripting();
    },
};
