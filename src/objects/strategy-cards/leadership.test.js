require("../../global"); // create globalEvents.TI4
const { Color } = require("../../wrapper/api");
const {
    MockGameObject,
    MockPlayer,
    globalEvents,
    world,
} = require("../../mock/mock-api");

const red = new Color(1, 0, 0);
const green = new Color(0, 1, 0);
const player1 = new MockPlayer({ name: "one", playerColor: red });
const player2 = new MockPlayer({ name: "two", playerColor: green });
world.__setPlayers([player1, player2]);

require("./leadership");

world.TI4.config.setPlayerCount(2);
world.TI4.getAllPlayerDesks()[0].seatPlayer(player1);
world.TI4.getAllPlayerDesks()[1].seatPlayer(player2);

describe("when a leadership card", () => {
    afterEach(() => {
        world.getUIs().map((ui) => world.removeUIElement(ui));
    });

    it("is played", () => {
        const beforeCount = world.getUIs().length;

        let card = new MockGameObject();
        globalEvents.TI4.onStrategyCardPlayed.trigger(card, player1);

        expect(world.getUIs().length).toBe(beforeCount + 2);
    });
});

describe("when a player has done the leadership selection", () => {
    it("it sends messages", () => {
        let card = new MockGameObject();
        const player1Spy = jest.spyOn(player1, "sendChatMessage");
        const player2Spy = jest.spyOn(player2, "sendChatMessage");

        globalEvents.TI4.onStrategyCardPlayed.trigger(card, player1);
        globalEvents.TI4.onStrategyCardSelectionDone.trigger(
            card,
            player1,
            player1.getSlot()
        );

        expect(player1Spy).toBeCalledWith(
            "one gained 0 command tokens.",
            player1.getPlayerColor()
        );
        expect(player2Spy).toBeCalledWith(
            "one gained 0 command tokens.",
            player1.getPlayerColor()
        );
    });
});
