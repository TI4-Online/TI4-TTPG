const { globalEvents } = require("@tabletop-playground/api");
const TriggerableMulticastDelegate = require("./lib/triggerable-multicast-delegate");

console.log("Welcome to Twilight Imperium IV");

// Create global events delegates BEFORE loading other global scripts.
globalEvents.TI4 = {
    // Called when the active player dropped a command token on a system.
    // <(object: system tile, player: Player) => void>
    onSystemActivated: new TriggerableMulticastDelegate(),

    // Called when a Strategy Card is Played
    // <(object: card, player:Player) => void>
    onStrategyCardPlayed: new TriggerableMulticastDelegate(),

    // Called when a Strategy Card selection is done by a player
    // <(object: card, player:Player) => void>
    onStrategyCardSelectionDone: new TriggerableMulticastDelegate(),
};

require("./global/patch-infinite-container");
require("./global/patch-unit-bag");
require("./global/r-swap-split-combine");
require("./global/strategy-card-functions");
require("./global/trigger-on-system-activated");
