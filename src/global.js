const { globalEvents } = require("@tabletop-playground/api");
const { TriggerableMulticastDelegate } = require('./lib/triggerable-multicast-delegate')

// Create global events delegates BEFORE loading other global scripts.
globalEvents.TI4 = {
    // Called when the active player dropped a command token on a system.
    // <(object: system tile, player: Player) => void>
    onSystemActivated : new TriggerableMulticastDelegate(),
}

require('./global/trigger-on-system-activated')
