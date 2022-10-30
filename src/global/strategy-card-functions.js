/*
 * Generic Scripting for Strategy Cards.
 *
 * Any strategy card with a nsid like "tile.strategy:<source>/<name>" gets a
 * play button.
 */

const assert = require("../wrapper/assert-wrapper");
const locale = require("../lib/locale");
const CONFIG = require("../game-ui/game-ui-config");
const { Broadcast } = require("../lib/broadcast");
const { ObjectNamespace } = require("../lib/object-namespace");
const {
    Button,
    GameObject,
    Rotator,
    UIElement,
    Vector,
    globalEvents,
    world,
} = require("../wrapper/api");

function setupStrategyCard(card) {
    assert(card instanceof GameObject);

    const playButtonName = locale("ui.button.strategy_card_play");
    const playButtonTooltip = locale("ui.tooltip.strategy_card_play");

    // Setup the play button
    card.play_button = new UIElement();
    card.play_button.position = new Vector(3, -0.5, -0.16 - CONFIG.buttonLift);
    card.play_button.rotation = new Rotator(180, 180, 0); // THis makes it appear ont he back side only.
    card.play_button.widget = new Button()
        .setText(playButtonName)
        .setFontSize(10);
    card.play_button.widget.onClicked.add((button, player) => {
        // Report.
        const parsed = ObjectNamespace.parseStrategyCard(card);
        const cardName = parsed ? locale(`tile.strategy.${parsed.card}`) : "?";
        const playerName = world.TI4.getNameByPlayerSlot(player.getSlot());
        const msg = locale("ui.message.strategy_card_play", {
            playerName,
            cardName,
        });
        Broadcast.broadcastAll(msg);

        // The event is the button, so getOwningObject gets the card itself.
        globalEvents.TI4.onStrategyCardPlayed.trigger(
            button.getOwningObject(),
            player
        );
    });

    card.addUI(card.play_button);

    const menuItemName = "*" + playButtonName;
    card.addCustomAction(menuItemName, playButtonTooltip);
    card.onCustomAction.add((card, player, name) => {
        switch (name) {
            case menuItemName:
                globalEvents.TI4.onStrategyCardPlayed.trigger(card, player);
                break;
        }
    });

    // Also escalate 'onMovementStopped' to the global event just for strategy cards.
    // TTPG can keep sending this event (physics?), suppress if not changed much.
    let lastLossy = "";
    card.onMovementStopped.add((obj) => {
        const pos = obj.getPosition();
        const rot = obj.getRotation();
        const lossy = [
            Math.round(pos.x),
            Math.round(pos.y),
            Math.round(pos.z),
            Math.round(rot.pitch),
            Math.round(rot.yaw),
            Math.round(rot.roll),
        ].join(",");
        if (lossy === lastLossy) {
            return;
        }
        lastLossy = lossy;

        globalEvents.TI4.onStrategyCardMovementStopped.trigger(obj);
    });
}

// Do not add UI during onObjectCreated.
function delayedSetupStrategyCard(card) {
    assert(card instanceof GameObject);
    process.nextTick(() => {
        process.nextTick(() => {
            // Watch out for double add.
            if (card.__hasStrategyCardButton) {
                return;
            }
            card.__hasStrategyCardButton = true;

            setupStrategyCard(card);
        });
    });
}

// Add our listener to future objects.
globalEvents.onObjectCreated.add((obj) => {
    if (ObjectNamespace.isStrategyCard(obj)) {
        delayedSetupStrategyCard(obj);
    }
});

// Script reload doesn't call onObjectCreated on existing objects, load manually.
if (world.getExecutionReason() === "ScriptReload") {
    for (const obj of world.getAllObjects()) {
        if (ObjectNamespace.isStrategyCard(obj)) {
            delayedSetupStrategyCard(obj);
        }
    }
}

module.exports = {
    setupStrategyCard,
};
