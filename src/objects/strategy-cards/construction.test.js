require("../../global"); // create globalEvents.TI4
const {
    globalEvents,
    world,
    MockGameObject,
    MockPlayer,
} = require("../../mock/mock-api");

const red = { r: 1, g: 0, b: 0 };
const green = { r: 0, g: 1, b: 0 };
const player1 = new MockPlayer({ name: "one", playerColor: red });
const player2 = new MockPlayer({ name: "two", playerColor: green });
world.__setPlayers([player1, player2]);

require("./construction");

world.TI4.config.setPlayerCount(2);
world.TI4.getAllPlayerDesks()[0].seatPlayer(player1);
world.TI4.getAllPlayerDesks()[1].seatPlayer(player2);

describe("when a strategy card is played", () => {
    afterEach(() => {
        const uiCount = world.getUIs().length;
        for (let i = 0; i < uiCount; i++) {
            world.removeUI(0);
        }
    });

    it("and it is the construction card", () => {
        const beforeCount = world.getUIs().length;

        let card = new MockGameObject();
        globalEvents.TI4.onStrategyCardPlayed.trigger(card, player1);

        expect(world.getUIs().length).toBe(beforeCount + 2);
    });
});

describe("when a player has done the strategy selection", () => {
    let card = new MockGameObject();

    let player1Spy, player2Spy;

    let uis = [];

    const original = world.addUI;

    beforeEach(() => {
        player1Spy = jest.spyOn(player1, "sendChatMessage");
        player2Spy = jest.spyOn(player2, "sendChatMessage");
        world.addUI = jest.fn((ui) => {
            uis.push(ui);
            original.call(world, ui);
        });
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it("by selecting the primary 1 space dock and 1 pds button", () => {
        globalEvents.TI4.onStrategyCardPlayed.trigger(card, player1);

        const button = uis[0].widget.getChild().getChildren()[1];
        button.onClicked.trigger(button, player1);

        expect(player1Spy).toBeCalledTimes(1);
        expect(player2Spy).toBeCalledTimes(1);
    });

    it("by selecting the primary 2 pds button", () => {
        globalEvents.TI4.onStrategyCardPlayed.trigger(card, player1);

        const button = uis[0].widget.getChild().getChildren()[2];
        button.onClicked.trigger(button, player1);

        expect(player1Spy).toBeCalledTimes(1);
        expect(player2Spy).toBeCalledTimes(1);
    });

    it("by selecting the secondary 1 space dock button", () => {
        globalEvents.TI4.onStrategyCardPlayed.trigger(card, player1);

        const button = uis[0].widget.getChild().getChildren()[3];
        button.onClicked.trigger(button, player1);

        expect(player1Spy).toBeCalledTimes(1);
        expect(player2Spy).toBeCalledTimes(1);
    });

    it("by selecting the secondary 1 pds button", () => {
        globalEvents.TI4.onStrategyCardPlayed.trigger(card, player1);

        const button = uis[0].widget.getChild().getChildren()[4];
        button.onClicked.trigger(button, player1);

        expect(player1Spy).toBeCalledTimes(1);
        expect(player2Spy).toBeCalledTimes(1);
    });

    it("by selecting the pass button", () => {
        globalEvents.TI4.onStrategyCardPlayed.trigger(card, player1);

        const button = uis[0].widget.getChild().getChildren()[5];
        button.onClicked.trigger(button, player1);

        expect(player1Spy).toBeCalledTimes(1);
        expect(player2Spy).toBeCalledTimes(1);
    });
});
