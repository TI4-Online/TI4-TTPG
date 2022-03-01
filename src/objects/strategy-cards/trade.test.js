require("../../global"); // create globalEvents.TI4
const { Color } = require("../../wrapper/api");
const {
    globalEvents,
    world,
    MockButton,
    MockGameObject,
    MockPlayer,
    MockText,
} = require("../../mock/mock-api");

const red = new Color(1, 0, 0);
const green = new Color(0, 1, 0);
const player1 = new MockPlayer({ name: "one", playerColor: red });
const player2 = new MockPlayer({ name: "two", playerColor: green });
world.__setPlayers([player1, player2]);

require("./trade");

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

    it("and it is the trade card", () => {
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
