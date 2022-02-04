const assert = require("assert");
const { globalEvents, MockGameObject, MockGameWorld, MockPlayer } = require("../../mock/mock-api");
const { createStragegyCardUi, broadcastMessage } = require("./strategy-card");
const TriggerableMulticastDelegate = require("../../lib/triggerable-multicast-delegate");
const locale = require("../../lib/locale");

// mock global.js event registration
globalEvents.TI4 = {
    onStrategyCardSelectionDone: new TriggerableMulticastDelegate()
};

it("broadcastMessage", () => {
    const red = {r: 1, g: 0, b: 0};
    const green = {r: 0, g: 1, b: 0};
    const player1 = new MockPlayer({playerColor: red});
    const player2 = new MockPlayer({playerColor: green});
    global.world = new MockGameWorld({ allPlayers: [player1, player2] });

    const player1MessageSpy = jest.spyOn(player1, "sendChatMessage");
    const player2MessageSpy = jest.spyOn(player2, "sendChatMessage");

    const testMessage = "test";

    broadcastMessage(testMessage, player2);
    expect(player1MessageSpy).toHaveBeenCalledTimes(1);
    expect(player1MessageSpy).toHaveBeenCalledWith(testMessage, green);
    expect(player2MessageSpy).toHaveBeenCalledTimes(1);
    expect(player2MessageSpy).toHaveBeenCalledWith(testMessage, green);
});

it("creating of a strategy card ui adds a close button and creates the UI accordingly", () => {
    let card = new MockGameObject();
    assert(false);
});

describe("when the close button is clicked in a players selection", () => {
    it("in case the owner clicked the button, then the global event triggers", () => {
        let card = new MockGameObject();
        assert(false);
    });

    it("in case the another player clicked the button, then the global event does not trigger", () => {
        let card = new MockGameObject();
        assert(false);
    });

    it("in case all players have resolved the strategy card, a message is broadcast", () => {
        let card = new MockGameObject();
        assert(false);
    });
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