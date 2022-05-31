const assert = require("../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../lib/object-namespace");
const { Card, globalEvents, world } = require("../wrapper/api");

function onPlanetCardMovementStopped(card) {
    assert(card instanceof Card);
    const isFaceUp = card.isFaceUp();
    if (card.__planetCardFaceUpValue != isFaceUp) {
        card.__planetCardFaceUpValue = isFaceUp;
        console.log(`onPlanetCardFlipped: ${ObjectNamespace.getNsid(card)}`);
        globalEvents.TI4.onPlanetCardFlipped.trigger(card, isFaceUp);
    }
}

function addListener(card) {
    assert(card instanceof Card);
    card.onMovementStopped.add(onPlanetCardMovementStopped);
    card.__hasPlanetCardFlipListener = true;

    const isFaceUp = card.isFaceUp();
    card.__planetCardFaceUpValue = isFaceUp;
}

globalEvents.TI4.onSingletonCardCreated.add((card) => {
    assert(card instanceof Card);
    const nsid = ObjectNamespace.getNsid(card);
    if (nsid.startsWith("card.planet")) {
        addListener(card);
    }
});

globalEvents.TI4.onSingletonCardMadeDeck.add((card) => {
    assert(card instanceof Card);
    if (card.__hasPlanetCardFlipListener) {
        card.onMovementStopped.remove(onPlanetCardMovementStopped);
    }
});

// Script reload doesn't call onObjectCreated on existing objects, load manually.
if (world.getExecutionReason() === "ScriptReload") {
    for (const obj of world.getAllObjects()) {
        if (!(obj instanceof Card)) {
            continue;
        }
        const nsid = ObjectNamespace.getNsid(obj);
        if (nsid.startsWith("card.planet")) {
            addListener(obj);
        }
    }
}
