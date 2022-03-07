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

    // Called after a player color changes (setup not finished).
    // <(playerColor: Color, deskIndex: number) => void>
    onPlayerColorChanged: new TriggerableMulticastDelegate(),

    // Called after the player count changes (setup not finished).
    // <(playerCount: number, player: Player|undefined) => void>
    onPlayerCountChanged: new TriggerableMulticastDelegate(),

    // Called when a singleton card is created, or when a deck is reduced to
    // a single card it is called on the "deck" (now a single card).
    // <(card: Card) => void>
    onSingletonCardCreated: new TriggerableMulticastDelegate(),

    // Called when a singleton card is converted into a deck.
    // <(card: Card) => void>
    onSingletonCardMadeDeck: new TriggerableMulticastDelegate(),

    // Called when the active player dropped a command token on a system.
    // <(systemTile: GameObject, player: Player) => void>
    onSystemActivated: new TriggerableMulticastDelegate(),

    // Called when an attachment mutates a system (probably a planet).
    // <(systemTile: GameObject) => void>
    onSystemChanged: new TriggerableMulticastDelegate(),

    // Called when a Strategy Card is Played
    // <(strategyCard: GameObject, player: Player) => void>
    onStrategyCardPlayed: new TriggerableMulticastDelegate(),

    // Called when a Strategy Card selection is done by a player
    // <(strategyCard: card, player:Player, owningPlayerSlot: number) => void>
    onStrategyCardSelectionDone: new TriggerableMulticastDelegate(),

    // Called when turn changes.
    // <(current: PlayerDesk, previous: PlayerDesk|undefined, player: Player) => void>
    onTurnChanged: new TriggerableMulticastDelegate(),

    // Called when setting turn order.
    // <playerDeskOrder: Array.{PlayerDesk}, player: Player) => void>
    onTurnOrderChanged: new TriggerableMulticastDelegate(),
};

// Some naughty scripts register global event listeners.
const { PlayerDesk } = require("./lib/player-desk/player-desk");
require("./setup/setup-secret-holders");

// Show setup ui.
require("./setup/game-setup/game-setup");
if (!world.__isMock) {
    console.log("Welcome to Twilight Imperium IV");
}

const { Faction } = require("./lib/faction/faction");
const { GameSetupConfig } = require("./setup/game-setup/game-setup-config");
const { GlobalSavedData } = require("./lib/saved-data/global-saved-data");
const { System, Planet } = require("./lib/system/system");
const { GameData } = require("./lib/game-data/game-data");
const { Turns } = require("./lib/turns");

// Register some functions in world to reduce require dependencies.
world.TI4 = {
    config: new GameSetupConfig(),
    gameData: new GameData(),
    turns: new Turns(true),

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
    getPlayerDeskByPlayerSlot: (playerSlot) => {
        return PlayerDesk.getByPlayerSlot(playerSlot);
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
        if (!world.__isMock) {
            world.resetScripting();
        }
    },
};

require("./global/active-idle-unit-modifiers");
require("./global/numpad-actions");
require("./global/on-container-rejected");
require("./global/patch-infinite-container");
require("./global/patch-exclusive-bags");
require("./global/r-swap-split-combine");
require("./global/right-click/right-click-system");
require("./global/right-click/right-click-agenda");
require("./global/right-click/right-click-purge");
require("./global/right-click/right-click-score");
require("./global/shuffle-decks-on-load");
require("./global/snap-system-tiles");
require("./global/strategy-card-functions");
require("./global/trigger-on-singleton-card");
require("./global/trigger-on-system-activated");
