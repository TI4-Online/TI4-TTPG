const TriggerableMulticastDelegate = require("./lib/triggerable-multicast-delegate");
const { globalEvents, world } = require("./wrapper/api");

// Expose button click handlers, canvas children.
//require("./objects/testp/monkey/monkey-interpose");

const onErr = (exception) => {
    world.TI4.errorReporting.error(exception.stack);
};

// Create global events delegates BEFORE loading other global scripts.
globalEvents.TI4 = {
    // Called when an ageda card enters or leaves the "agenda spot" on the mat.
    // <(agendaCard: GameObject|undefined) => void>
    onAgendaChanged: new TriggerableMulticastDelegate(onErr),

    // Called when agenda player status changes (clicked "no whens", edited votes, etc).
    // <() => void>
    onAgendaPlayerStateChanged: new TriggerableMulticastDelegate(onErr),

    // Called when a script broadcasts a message to all players (either as broadcast or chat window only).
    // <(message: string, color: Color) => void>
    onBroadcast: new TriggerableMulticastDelegate(onErr),

    // Called when container rejects an added object.
    // Object is still inside container when this event fires, handlers should
    // verify object.getContainer matches in case multiple act on it.
    // <(container: Container, rejectedObjects: Array.{GameObject}, player: Player|undefined) => void>
    onContainerRejected: new TriggerableMulticastDelegate(onErr),

    // Called after a player unpacks (or re-packs!) a faction.
    // Note the the "player" is the player who clicked the button, they
    // might not be seated at the given desk.
    // <(deskPlayerSlot: number, player: Player|undefined) => void>
    onFactionChanged: new TriggerableMulticastDelegate(onErr),

    // Called after a player drops a control token on the final scoreboard slot.
    // <(player: Player|undefined) => void>
    onGameEnded: new TriggerableMulticastDelegate(onErr),

    // Called after a player clicks the initial game "setup" button.
    // <(state: object, player: Player) => void>
    onGameSetup: new TriggerableMulticastDelegate(onErr),

    // Called when a player flips a planet card.
    // <(card: Card, isFaceUp: boolean) => void>
    onPlanetCardFlipped: new TriggerableMulticastDelegate(onErr),

    // Called after a player color changes (setup not finished).
    // <(playerColor: Color, deskIndex: number) => void>
    onPlayerColorChanged: new TriggerableMulticastDelegate(onErr),

    // Called after the player count changes (setup not finished).
    // <(playerCount: number, player: Player|undefined) => void>
    onPlayerCountChanged: new TriggerableMulticastDelegate(onErr),

    // Called immediately before the player count changes (setup not finished).
    // <(playerCount: incoming number, player: Player|undefined) => void>
    onPlayerCountAboutToChange: new TriggerableMulticastDelegate(onErr),

    // Called shortly after a player joins.  (Trying to do less work on immediate join.)
    // <(player: Player) => void>
    onPlayerJoinedDelayed: new TriggerableMulticastDelegate(onErr),

    // Called when a singleton card is created, or when a deck is reduced to
    // a single card it is called on the "deck" (now a single card).
    // <(card: Card) => void>
    onSingletonCardCreated: new TriggerableMulticastDelegate(onErr),

    // Called when a singleton card is converted into a deck.
    // <(card: Card) => void>
    onSingletonCardMadeDeck: new TriggerableMulticastDelegate(onErr),

    // Called when the active player dropped a command token on a system.
    // <(systemTile: GameObject, player: Player) => void>
    onSystemActivated: new TriggerableMulticastDelegate(onErr),

    // Called when an attachment mutates a system (probably a planet).
    // <(systemTile: GameObject) => void>
    onSystemChanged: new TriggerableMulticastDelegate(onErr),

    // Called when a Strategy Card is dropped/flipped or otherwise stops moving.
    // Useful for updating picks & when flipped.
    // <(strategyCard: GameObject, player: Player) => void>
    onStrategyCardMovementStopped: new TriggerableMulticastDelegate(onErr),

    // Called when a Strategy Card is Played
    // <(strategyCard: GameObject, player: Player) => void>
    onStrategyCardPlayed: new TriggerableMulticastDelegate(onErr),

    // Called when a Strategy Card selection is done by a player
    // <(strategyCard: card, player:Player, owningPlayerSlot: number) => void>
    onStrategyCardSelectionDone: new TriggerableMulticastDelegate(onErr),

    // Called when turn changes.
    // <(current: PlayerDesk, previous: PlayerDesk|undefined, player: Player|undefined) => void>
    onTurnChanged: new TriggerableMulticastDelegate(onErr),

    // Called when setting turn order.
    // <(playerDeskOrder: Array.{PlayerDesk}, player: Player|undefined) => void>
    onTurnOrderChanged: new TriggerableMulticastDelegate(onErr),

    // Called when all players have passed.
    // <(player: Player|undefined) => void>
    onTurnOrderEmpty: new TriggerableMulticastDelegate(onErr),

    // Called when a turn passed status changes.
    // <(playerSlot: Number, clickingPlayer: Player) => void>
    onTurnPassedChanged: new TriggerableMulticastDelegate(onErr),
};

globalEvents.onPlayerJoined.add((player) => {
    setTimeout(() => {
        console.log(
            `globalEvents.TI4.onPlayerJoinedDelayed: "${player.getName()}"`
        );
        globalEvents.TI4.onPlayerJoinedDelayed.trigger(player);
    }, 1000);
});

// Some naughty scripts register global event listeners.
const { PlayerDesk } = require("./lib/player-desk/player-desk");
require("./setup/setup-secret-holders");
require("./lib/whisper/whisper-history");

if (!world.__isMock) {
    console.log("Welcome to Twilight Imperium IV");
}

const { Agenda } = require("./lib/agenda/agenda");
const {
    AsyncTaskQueue,
    DEFAULT_ASYNC_DELAY,
} = require("./lib/async-task-queue/async-task-queue");
const { Borders } = require("./lib/borders/borders");
const { ErrorReporting } = require("./global/error-reporting");
const { Faction } = require("./lib/faction/faction");
const { FogOfWar } = require("./lib/fog-of-war/fog-of-war");
const { GameData } = require("./lib/game-data/game-data");
const { GameSetupConfig } = require("./setup/game-setup/game-setup-config");
const { GlobalSavedData } = require("./lib/saved-data/global-saved-data");
const { Homebrew } = require("./lib/homebrew/homebrew");
const { System, Planet } = require("./lib/system/system");
const { Turns } = require("./lib/turns");
const { PerfStats } = require("./lib/perf/perf-stats");
const { UnitPlastic } = require("./lib/unit/unit-plastic");

// Register some functions in world to reduce require dependencies.
world.TI4 = {
    agenda: new Agenda(),
    asyncTaskQueue: new AsyncTaskQueue(DEFAULT_ASYNC_DELAY, onErr),
    borders: new Borders(),
    config: new GameSetupConfig(),
    errorReporting: new ErrorReporting(),
    fogOfWar: new FogOfWar(),
    gameData: new GameData(),
    homebrew: new Homebrew(),
    perfStats: new PerfStats(),
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
    getAllSystems: () => {
        return System.getAllSystems();
    },
    getAllSystemTileObjects: () => {
        return System.getAllSystemTileObjects();
    },
    getAllUnitPlastics: () => {
        return UnitPlastic.getAll();
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
    getNameByPlayerSlot: (playerSlot) => {
        return (
            world.TI4.getFactionByPlayerSlot(playerSlot)?.nameFull ||
            world.TI4.getPlayerDeskByPlayerSlot(playerSlot)?.colorName ||
            world.getPlayerBySlot(playerSlot)?.getName() ||
            "<???>"
        );
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

require("./game-ui/game-ui");
require("./global/active-idle-unit-modifiers");
require("./global/chat-commands");
require("./global/desk-turn-order");
require("./global/export-game");
require("./global/gamedata-key");
//require("./global/highlight-active-turn"); // desk-turn-order does this now
require("./global/highlight-on-system-activated");
require("./global/numpad-actions");
require("./global/on-container-rejected");
require("./global/on-turn-changed-sound");
require("./global/planet-card-attachments");
require("./global/r-swap-split-combine");
require("./global/right-click/heroes/helio-command-array");
require("./global/right-click/heroes/dimensional-anchor");
require("./global/right-click/heroes/multiverse-shift");
require("./global/right-click/right-click-system");
require("./global/right-click/right-click-agenda");
require("./global/right-click/right-click-fetch-planet");
require("./global/right-click/right-click-iihq-modernization");
require("./global/right-click/right-click-maban-omega");
require("./global/right-click/right-click-mageon-implants");
require("./global/right-click/right-click-purge");
require("./global/right-click/right-click-remaining-cards");
require("./global/right-click/right-click-score");
require("./global/right-click/right-click-trade-agreement");
require("./global/right-click/right-click-yssaril-commander");
//require("./global/screen-ui/end-turn"); // not ready
require("./global/shuffle-decks-on-load");
require("./global/snap-system-tiles");
require("./global/strategy-card-functions");
require("./global/trigger-on-game-ended");
require("./global/trigger-on-planet-card-flipped");
require("./global/trigger-on-singleton-card");
require("./global/trigger-on-system-activated");
require("./global/whisper-message");

if (!world.__isMock) {
    world.setShowDiceRollMessages(false);
    GameData.maybeRestartGameData();
    world.TI4.fogOfWar.maybeEnable();
}
