/*
 * Generic Scripting for Strategy Cards.
 *
 * Any strategy card with a nsid like "tile.strategy:<source>/<name>" gets a
 * play button.
 */

const {
    Button,
    Rotator,
    UIElement,
    Vector,
    globalEvents,
    world,
} = require("@tabletop-playground/api");
const { ObjectNamespace } = require("../lib/object-namespace");
const locale = require("../lib/locale");

globalEvents.TI4.onStrategyCardPlayed.add((card, player) => {
    const message = locale("ui.message.strategy_card_play", {
        playerName: player.getName(),
        cardName: card.getName(),
    });
    for (const p of world.getAllPlayers()) {
        p.showMessage(message);
    }
});

function setupStrategyCard(card) {
    const playButtonName = locale("ui.button.strategy_card_play");
    const playButtonTooltip = locale("ui.tooltip.strategy_card_play");

    // Setup the play button
    card.play_button = new UIElement();
    card.play_button.position = new Vector(3, -0.5, -0.2);
    card.play_button.rotation = new Rotator(180, 180, 0); // THis makes it appear ont he back side only.
    card.play_button.widget = new Button()
        .setText(playButtonName)
        .setFontSize(10);
    card.play_button.widget.onClicked.add((button, player) => {
        // The event is the button, so getOwningObject gets the card itself.
        globalEvents.TI4.onStrategyCardPlayed.trigger(
            button.getOwningObject(),
            player
        );
    });

    card.addUI(card.play_button);

    card.addCustomAction(playButtonName, playButtonTooltip);

    card.onCustomAction.add((card, player, name) => {
        switch (name) {
            case playButtonName:
                globalEvents.TI4.onStrategyCardPlayed.trigger(card, player);
                break;
        }
    });
}

// Add our listener to future objects.
globalEvents.onObjectCreated.add((obj) => {
    if (ObjectNamespace.isStrategyCard(obj)) {
        setupStrategyCard(obj);
    }
});

// Script reload doesn't onObjectCreated existing objects, load manually.
if (world.getExecutionReason() === "ScriptReload") {
    for (const obj of world.getAllObjects()) {
        if (ObjectNamespace.isStrategyCard(obj)) {
            setupStrategyCard(obj);
        }
    }
}
