/**
 * Add active/idle buttons to those unit modifiers.
 */
const { ActiveIdle } = require("../lib/unit/active-idle");
const { UnitModifier } = require("../lib/unit/unit-modifier");
const { Card, globalEvents, world } = require("../wrapper/api");

globalEvents.TI4.onSingletonCardCreated.add((card) => {
    if (UnitModifier.isToggleActiveObject(card)) {
        ActiveIdle.addToggleActiveButton(card);
        card.__hasToggleActiveButton = true;
    }
});

globalEvents.TI4.onSingletonCardMadeDeck.add((card) => {
    if (card.__hasToggleActiveButton) {
        ActiveIdle.removeToggleActiveButton(card);
        delete card.__hasToggleActiveButton;
    }
});

// Script reload doesn't call onObjectCreated on existing objects, load manually.
if (world.getExecutionReason() === "ScriptReload") {
    process.nextTick(() => {
        for (const obj of world.getAllObjects()) {
            if (!(obj instanceof Card)) {
                continue;
            }
            if (!UnitModifier.isToggleActiveObject(obj)) {
                continue;
            }
            ActiveIdle.addToggleActiveButton(obj);
            obj.__hasToggleActiveButton = true;
        }
    });
}
