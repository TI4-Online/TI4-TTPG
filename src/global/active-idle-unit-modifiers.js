/**
 * Add active/idle buttons to those unit modifiers.
 */
const { ActiveIdle } = require("../lib/unit/active-idle");
const { UnitModifier } = require("../lib/unit/unit-modifier");
const { globalEvents, world } = require("../wrapper/api");

globalEvents.onObjectCreated.add((obj) => {
    if (UnitModifier.isToggleActiveObject(obj)) {
        ActiveIdle.addToggleActiveButton(obj);
    }
});

// Script reload doesn't call onObjectCreated on existing objects, load manually.
if (world.getExecutionReason() === "ScriptReload") {
    for (const obj of world.getAllObjects()) {
        if (UnitModifier.isToggleActiveObject(obj)) {
            ActiveIdle.addToggleActiveButton(obj);
        }
    }
}
