const {
    globalEvents,
    MockGameObject,
    MockGameWorld,
    MockPlayer,
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

require("./diplomacy");

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

    it("and it is the diplomacy card", () => {
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

        globalEvents.TI4.onStrategyCardPlayed.trigger(card, player1);
    });

    afterEach(() => {
        jest.resetAllMocks();

        const uiCount = global.world.getUIs().length;
        for (let i = 0; i < uiCount; i++) {
            global.world.removeUI(0);
        }
    });

    it("by selecting the primary button", () => {
        const button = uis[0].widget.getChild().getChildren()[1];
        button.onClicked.trigger(button, player1);

        expect(player1Spy).toBeCalledWith(
            "one uses the primary ability of Diplomacy.",
            player1.getPlayerColor()
        );
        expect(player2Spy).toBeCalledWith(
            "one uses the primary ability of Diplomacy.",
            player1.getPlayerColor()
        );
    });

    it("by selecting the secondary button", () => {
        const button = uis[0].widget.getChild().getChildren()[2];
        button.onClicked.trigger(button, player1);

        expect(player1Spy).toBeCalledWith(
            "one uses the secondary ability of Diplomacy.",
            player1.getPlayerColor()
        );
        expect(player2Spy).toBeCalledWith(
            "one uses the secondary ability of Diplomacy.",
            player1.getPlayerColor()
        );
    });

    it("by selecting the pass button", () => {
        const button = uis[0].widget.getChild().getChildren()[3];
        button.onClicked.trigger(button, player1);

        expect(player1Spy).toBeCalledWith(
            "one passes on Diplomacy.",
            player1.getPlayerColor()
        );
        expect(player2Spy).toBeCalledWith(
            "one passes on Diplomacy.",
            player1.getPlayerColor()
        );
    });
});
