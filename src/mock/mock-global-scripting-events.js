const TriggerableMulticastDelegate = require("../lib/triggerable-multicast-delegate");

class GlobalScriptingEvents {
    onChatMessage = new TriggerableMulticastDelegate();
    onCustomAction = new TriggerableMulticastDelegate();
    onDiceRolled = new TriggerableMulticastDelegate();
    onObjectCreated = new TriggerableMulticastDelegate();
    onObjectDestroyed = new TriggerableMulticastDelegate();
    onPlayerJoined = new TriggerableMulticastDelegate();
    onPlayerLeft = new TriggerableMulticastDelegate();
    onPlayerSwitchedSlots = new TriggerableMulticastDelegate();
    onScriptButtonPressed = new TriggerableMulticastDelegate();
    onScriptButtonReleased = new TriggerableMulticastDelegate();
    onTeamChatMessage = new TriggerableMulticastDelegate();
    onTick = new TriggerableMulticastDelegate();
    onWhisper = new TriggerableMulticastDelegate();
}

module.exports = GlobalScriptingEvents;
