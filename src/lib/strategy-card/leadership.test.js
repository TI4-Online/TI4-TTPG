import * as strategyCardApi from "./strategy-card";

const assert = require("assert");
const {
    globalEvents,
    MockGameObject,
    MockGameWorld,
    MockPlayer,
} = require("../../mock/mock-api");
const { createStrategyCardUi } = require("./strategy-card");
const TriggerableMulticastDelegate = require("../../lib/triggerable-multicast-delegate");

// mock global.js event registration
globalEvents.TI4 = {
    onStrategyCardPlayed: new TriggerableMulticastDelegate(),
    onStrategyCardSelectionDone: new TriggerableMulticastDelegate(),
};

require("./leadership");

const red = { r: 1, g: 0, b: 0 };
const green = { r: 0, g: 1, b: 0 };
const player1 = new MockPlayer({ name: "one", playerColor: red });
const player2 = new MockPlayer({ name: "two", playerColor: green });
global.world = new MockGameWorld({ allPlayers: [player1, player2] });

it("when a leadership play button is clicked", () => {
    let card = new MockGameObject();
    const player = new MockPlayer();
    let gameObject = new MockGameObject();
    jest.spyOn(global.world, "createObjectFromTemplate").mockReturnValue(
        gameObject
    );
    const addUiSpy = jest.spyOn(gameObject, "addUI");

    globalEvents.TI4.onStrategyCardPlayed.trigger(card, player1);

    expect(addUiSpy).toBeCalledTimes(2);
});

describe("when a player has done the strategy selection", () => {
    let card = new MockGameObject();
    const player1Spy = jest.spyOn(player1, "sendChatMessage");
    const player2Spy = jest.spyOn(player1, "sendChatMessage");

    globalEvents.TI4.onStrategyCardPlayed.trigger(card, player1);
    globalEvents.TI4.onStrategyCardSelectionDone.trigger(card, player1);

    expect(player1Spy).toBeCalledWith(
        "one gained 0 command tokens.",
        player1.getPlayerColor()
    );
    expect(player2Spy).toBeCalledWith(
        "one gained 0 command tokens.",
        player1.getPlayerColor()
    );
});
