const assert = require("assert");
const { globalEvents, MockGameObject } = require("../../mock/mock-api");
const { setupStrategyCard } = require("./strategy-card");
const TriggerableMulticastDelegate = require("../../lib/triggerable-multicast-delegate");
const locale = require("../../lib/locale");

// mock global.js event registration
globalEvents.TI4 = {
    onStrategyCardPlayed: new TriggerableMulticastDelegate(),
    onStrategyCardSelectionDone: new TriggerableMulticastDelegate()
};

it("when a leadership play button is clicked", () => {
    let card = new MockGameObject();
    assert(false);
});

it("when a player has done her selection", () => {
    let card = new MockGameObject();
    assert(false);
});

/*
it("broadcastMessage", () => {
    expect.assertions(2);
    let card = new MockGameObject();
    const player = {};
    globalEvents.TI4.onStrategyCardPlayed.add((owningObject, clickingPlayer) => {
        expect(owningObject).toBe(card);
        expect(clickingPlayer).toBe(player);
    });

    setupStrategyCard(card);
    const playButton = card.play_button;
    playButton.widget.onClicked.trigger(playButton, player);
});*/