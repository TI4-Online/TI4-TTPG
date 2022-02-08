const { globalEvents } = require("@tabletop-playground/api");
const TriggerableMulticastDelegate = require("./lib/triggerable-multicast-delegate");

console.log("Welcome to Twilight Imperium IV");

// Create global events delegates BEFORE loading other global scripts.
globalEvents.TI4 = {
    // Called when container rejects an added object.
    // Object is still inside container when this event fires, handlers should
    // verify object.getContainer matches in case multiple act on it.
    // <(container: Container, rejectedObjects: Array.{GameObject}, player: Player) => void>
    onContainerRejected: new TriggerableMulticastDelegate(),

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
require("./lib/player-desk");
