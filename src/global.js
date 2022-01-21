const { globalEvents } = require("@tabletop-playground/api");
const { TriggerableMulticastDelegate } = require('./lib/triggerable-multicast-delegate')

// Create global events delegates BEFORE loading other global scripts.
globalEvents.TI4 = {
    // Called when the active player dropped a command token on a system.
    // <(object: system tile, player: Player) => void>
    onSystemActivated : new TriggerableMulticastDelegate(),
    // Called when a Strategy Card is Played
    // <(object: cardd, player:Player) => void>
    onStrategyCardPlayed : new TriggerableMulticastDelegate(),
}

require('./global/trigger-on-system-activated')
require('./global/strategy-card-functions')




if (world.getExecutionReason() === 'ScriptReload') {
    for (const obj of world.getAllObjects()) {
        globalEvents.onObjectCreated.trigger(obj);
    }
}
