const assert = require("../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../lib/object-namespace");
const { Card, GameObject, globalEvents, world } = require("../wrapper/api");

function addAttachmentsUI(card) {
    assert(card instanceof Card);

    const planet = world.TI4.getPlanetByCard(card);
    if (!planet) {
        return;
    }

    if (card.__hasAttachmentsUI) {
        removeAttachmentsUI(card);
    }
    console.log(`addAttachmentsUI: ${planet.getNameStr()}`);

    // TODO XXX

    card.__hasAttachmentsUI = true;
}

function removeAttachmentsUI(card) {
    assert(card instanceof Card);

    const planet = world.TI4.getPlanetByCard(card);
    if (!planet) {
        return;
    }
    console.log(`removeAttachmentsUI: ${planet.getNameStr()}`);

    for (const ui of card.getUIs()) {
        card.removeUI(ui);
    }
    delete card.__hasAttachmentsUI;
}

globalEvents.TI4.onSystemChanged.add((systemTileObj) => {
    assert(systemTileObj instanceof GameObject);

    // Get card NSIDs.
    const system = world.TI4.getSystemBySystemTileObject(systemTileObj);
    const cardNsids = new Set();
    for (const planet of system.planets) {
        const cardNsid = planet.getPlanetCardNsid();
        cardNsids.add(cardNsid);
    }

    // Find cards.
    const cards = [];
    for (const obj of world.getAllObjects()) {
        const nsid = ObjectNamespace.getNsid(obj);
        if (cardNsids.has(nsid)) {
            cards.push(obj);
        }
    }

    // Modify.
    for (const card of cards) {
        addAttachmentsUI(card);
    }
});

globalEvents.TI4.onSingletonCardCreated.add((card) => {
    assert(card instanceof Card);
    const nsid = ObjectNamespace.getNsid(card);
    if (nsid.startsWith("card.planet")) {
        addAttachmentsUI(card);
    }
});

globalEvents.TI4.onSingletonCardMadeDeck.add((card) => {
    assert(card instanceof Card);
    if (card.__hasAttachmentsUI) {
        removeAttachmentsUI(card);
    }
});

// Script reload doesn't call onObjectCreated on existing objects, load manually.
if (world.getExecutionReason() === "ScriptReload") {
    for (const obj of world.getAllObjects()) {
        const nsid = ObjectNamespace.getNsid(obj);
        if (nsid.startsWith("card.planet")) {
            addAttachmentsUI(obj);
        }
    }
}
