require("../../global"); // create globalEvents.TI4
const { Color } = require("../../wrapper/api");
const {
    globalEvents,
    world,
    MockGameObject,
    MockPlayer,
} = require("../../mock/mock-api");

const red = new Color(1, 0, 0);
const green = new Color(0, 1, 0);
const player1 = new MockPlayer({ name: "one", playerColor: red });
const player2 = new MockPlayer({ name: "two", playerColor: green });
world.__setPlayers([player1, player2]);

require("./diplomacy");

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

    it("and it is the diplomacy card", () => {
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

        globalEvents.TI4.onStrategyCardPlayed.trigger(card, player1);
    });

    afterEach(() => {
        jest.resetAllMocks();

        const uiCount = world.getUIs().length;
        for (let i = 0; i < uiCount; i++) {
            world.removeUI(0);
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
