const { globalEvents, world } = require("./wrapper/api");
const TriggerableMulticastDelegate = require("./lib/triggerable-multicast-delegate");

if (!world.__isMock) {
    console.log("Welcome to Twilight Imperium IV");
}

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

// Register some functions in world to reduce require dependencies.
const { System, Planet } = require("./lib/system/system");
world.TI4 = {
    getActiveSystemTileObject: () => {
        return System.getActiveSystemTileObject();
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

    getPlanetByCard: (card) => {
        return Planet.getByCard(card);
    },
    getPlanetByCardNsid: (nsid) => {
        return Planet.getByCardNsid(nsid);
    },
    getPlayerCount: () => {
        return PlayerDesk.getPlayerCount();
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

    setPlayerCount: (count) => {
        return PlayerDesk.setPlayerCount(count);
    },
};
