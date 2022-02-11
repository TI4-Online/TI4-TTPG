// This test is representing all strategy cards build with the registers-standard-card.js

const {
    globalEvents,
    MockButton,
    MockGameObject,
    MockGameWorld,
    MockPlayer,
    MockText,
} = require("../../mock/mock-api");
const { PlayerDesk } = require("../../lib/player-desk");
const TriggerableMulticastDelegate = require("../../lib/triggerable-multicast-delegate");

// mock global.js event registration
globalEvents.TI4 = {
    onStrategyCardPlayed: new TriggerableMulticastDelegate(),
    onStrategyCardSelectionDone: new TriggerableMulticastDelegate(),
};

const red = { r: 1, g: 0, b: 0 };
const green = { r: 0, g: 1, b: 0 };
const player1 = new MockPlayer({ name: "one", playerColor: red });
const player2 = new MockPlayer({ name: "two", playerColor: green });
global.world = new MockGameWorld({ allPlayers: [player1, player2] });

require("./trade");

PlayerDesk.setPlayerCount(2);
PlayerDesk.getPlayerDesks()[0].seatPlayer(player1);
PlayerDesk.getPlayerDesks()[1].seatPlayer(player2);

describe("when a strategy card is played", () => {
    afterEach(() => {
        const uiCount = global.world.getUIs().length;
        for (let i = 0; i < uiCount; i++) {
            global.world.removeUI(0);
        }
    });

    it("and it is the trade card", () => {
        let card = new MockGameObject();

        globalEvents.TI4.onStrategyCardPlayed.trigger(card, player1);

        expect(global.world.getUIs().length).toBe(2);
    });
});

describe("when a player has done the strategy selection", () => {
    let card = new MockGameObject();

    let player1Spy, player2Spy;

    let uis = [];

    const original = global.world.addUI;

    beforeEach(() => {
        player1Spy = jest.spyOn(player1, "sendChatMessage");
        player2Spy = jest.spyOn(player2, "sendChatMessage");
        global.world.addUI = jest.fn((ui) => {
            uis.push(ui);
            original.call(global.world, ui);
        });
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("by selecting the primary ability button", () => {
        globalEvents.TI4.onStrategyCardPlayed.trigger(card, player1);

        const button = uis[0].widget.getChild().getChildren()[1];
        button.onClicked.trigger(button, player1);

        expect(player1Spy).toBeCalledTimes(1);
        expect(player2Spy).toBeCalledTimes(1);
    });

    it("by selecting the replenish button", () => {
        globalEvents.TI4.onStrategyCardPlayed.trigger(card, player1);

        const replenishBorder = uis[0].widget.getChild().getChildren()[2];
        const replenishButton = replenishBorder.getChild().getChildren()[1];

        expect(replenishBorder.getChild().getChildren().length).toBe(2);
        expect(replenishBorder.getChild().getChildren()[0].constructor).toBe(
            MockText
        );
        expect(replenishButton.constructor).toBe(MockButton);
        replenishBorder
            .getChild()
            .getChildren()[1]
            .onClicked.trigger(replenishButton, player1);

        expect(player1Spy).toBeCalledTimes(1);
        expect(player2Spy).toBeCalledTimes(1);
    });

    it("by selecting the secondary ability button", () => {
        globalEvents.TI4.onStrategyCardPlayed.trigger(card, player1);

        const button = uis[0].widget.getChild().getChildren()[3];
        button.onClicked.trigger(button, player1);

        expect(player1Spy).toBeCalledTimes(1);
        expect(player2Spy).toBeCalledTimes(1);
    });

    it("by selecting the pass button", () => {
        globalEvents.TI4.onStrategyCardPlayed.trigger(card, player1);

        const button = uis[0].widget.getChild().getChildren()[4];
        button.onClicked.trigger(button, player1);

        expect(player1Spy).toBeCalledTimes(1);
        expect(player2Spy).toBeCalledTimes(1);
    });
});
