/**
 * Add active/idle buttons to those unit modifiers.
 */
const assert = require("../wrapper/assert-wrapper");
const { ActiveIdle } = require("../lib/unit/active-idle");
const { UnitModifier } = require("../lib/unit/unit-modifier");
const { Card, globalEvents, world } = require("../wrapper/api");

function delayedAddToggleActiveButton(card) {
    assert(card instanceof Card);
    process.nextTick(() => {
        ActiveIdle.addToggleActiveButton(card);
        card.__hasToggleActiveButton = true;
    });
}

globalEvents.TI4.onSingletonCardCreated.add((card) => {
    if (UnitModifier.isToggleActiveObject(card)) {
        delayedAddToggleActiveButton(card);
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
    for (const obj of world.getAllObjects()) {
        if (!(obj instanceof Card)) {
            continue;
        }
        if (!UnitModifier.isToggleActiveObject(obj)) {
            continue;
        }
        delayedAddToggleActiveButton(obj);
    }
}
