const assert = require("assert");
const { globalEvents, MockGameObject } = require("../mock/mock-api");
const { setupStrategyCard } = require("./strategy-card-functions");
const TriggerableMulticastDelegate = require("../lib/triggerable-multicast-delegate");
const locale = require("../lib/locale");

// mock global.js event registration
globalEvents.TI4 = {
    // Called when a Strategy Card is Played
    // <(object: card, player:Player) => void>
    onStrategyCardPlayed: new TriggerableMulticastDelegate()
};

it("setupStrategyCard creates a play button and a custom action", () => {
    let card = new MockGameObject();

    setupStrategyCard(card);

    assert(card.getUIs().length === 1);
    assert(card._customActions.length === 1);
});

it("the custom action triggers the global event on play", () => {
    let card = new MockGameObject();
    let playButtonHitCounter = 0;
    globalEvents.TI4.onStrategyCardPlayed.add(() => playButtonHitCounter++);

    setupStrategyCard(card);

    card.onCustomAction.trigger(card, undefined /*player*/, locale("ui.button.strategy_card_play"));
    expect(playButtonHitCounter).toBe(1);
    card.onCustomAction.trigger(card, undefined /*player*/, "not the play button you are looking for");
    expect(playButtonHitCounter).toBe(1);
});

it("the button triggers the global event on click", () => {
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
});