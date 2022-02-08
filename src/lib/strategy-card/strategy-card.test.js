const {
    globalEvents,
    MockButton,
    MockGameObject,
    MockGameWorld,
    MockPlayer,
    MockVerticalBox,
} = require("../../mock/mock-api");
const { PlayerDesk } = require("../../lib/player-desk");
const {
    broadcastMessage,
    createStrategyCardUi,
    onUiClosedClicked,
} = require("./strategy-card");
const TriggerableMulticastDelegate = require("../../lib/triggerable-multicast-delegate");

// mock global.js event registration
globalEvents.TI4 = {
    onStrategyCardSelectionDone: new TriggerableMulticastDelegate(),
};

it("broadcastMessage", () => {
    const red = {
        r: 1,
        g: 0,
        b: 0,
    };
    const green = {
        r: 0,
        g: 1,
        b: 0,
    };
    const player1 = new MockPlayer({
        playerColor: red,
    });
    const player2 = new MockPlayer({
        playerColor: green,
    });
    global.world = new MockGameWorld({
        allPlayers: [player1, player2],
    });

    const player1MessageSpy = jest.spyOn(player1, "sendChatMessage");
    const player2MessageSpy = jest.spyOn(player2, "sendChatMessage");

    const testMessage = "test";

    broadcastMessage(testMessage, player2);
    expect(player1MessageSpy).toHaveBeenCalledTimes(1);
    expect(player1MessageSpy).toHaveBeenCalledWith(testMessage, green);
    expect(player2MessageSpy).toHaveBeenCalledTimes(1);
    expect(player2MessageSpy).toHaveBeenCalledWith(testMessage, green);
});

it("creating a strategy card with a widgetFactory", () => {
    const red = {
        r: 1,
        g: 0,
        b: 0,
    };
    const player = new MockPlayer({
        playerColor: red,
    });
    global.world = new MockGameWorld({
        allPlayers: [player],
    });
    PlayerDesk.setPlayerCount(1);
    PlayerDesk.getPlayerDesks()[0].seatPlayer(player);

    let widget = new MockVerticalBox();
    widget.addChild(new MockButton());
    const widgetFactory = function () {
        return widget;
    };

    let gameObject = new MockGameObject();

    createStrategyCardUi(gameObject, widgetFactory);

    expect(global.world.getUIs().length).toBe(1);
    expect(global.world.getUIs()[0].widget.getChild()).toBe(widget);
});

describe("when the close button is clicked in a players selection", () => {
    let player1, player2, buttons, widgetFactory;

    beforeEach(() => {
        const red = {
            r: 1,
            g: 0,
            b: 0,
        };
        const green = {
            r: 0,
            g: 1,
            b: 0,
        };
        player1 = new MockPlayer({
            name: "player1",
            playerColor: red,
            slot: 1,
        });
        player2 = new MockPlayer({
            name: "player2",
            playerColor: green,
            slot: 2,
        });
        global.world = new MockGameWorld({
            allPlayers: [player1, player2],
        });

        buttons = [new MockButton(), new MockButton()];
        let index = 0;

        widgetFactory = function () {
            let widget = new MockVerticalBox();
            widget.addChild(buttons[index]);
            index++;
            return widget;
        };

        PlayerDesk.setPlayerCount(2);
        PlayerDesk.getPlayerDesks()[0].seatPlayer(player1);
        PlayerDesk.getPlayerDesks()[1].seatPlayer(player2);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("in case the owner clicked the button, then the global event triggers", () => {
        const card = new MockGameObject({
            id: "card1",
        });
        const globalEventTriggerSpy = jest.spyOn(
            globalEvents.TI4.onStrategyCardSelectionDone,
            "trigger"
        );
        createStrategyCardUi(card, widgetFactory);

        onUiClosedClicked(buttons[0], player1);

        expect(globalEventTriggerSpy).toHaveBeenCalledTimes(1);
    });

    it("in case the another player clicked the button, then the global event does not trigger", () => {
        const card = new MockGameObject({
            id: "card2",
        });
        const globalEventTriggerSpy = jest.spyOn(
            globalEvents.TI4.onStrategyCardSelectionDone,
            "trigger"
        );
        createStrategyCardUi(card, widgetFactory);

        onUiClosedClicked(buttons[0], player2);

        expect(globalEventTriggerSpy).toHaveBeenCalledTimes(0);
    });

    it("in case all players have resolved the strategy card, a message is broadcast", () => {
        const card = new MockGameObject({
            id: "card3",
        });
        const player1SendChatMessageSpy = jest.spyOn(
            player1,
            "sendChatMessage"
        );
        const player2SendChatMessageSpy = jest.spyOn(
            player2,
            "sendChatMessage"
        );
        createStrategyCardUi(card, widgetFactory);

        onUiClosedClicked(buttons[1], player2);
        onUiClosedClicked(buttons[0], player1);

        expect(player1SendChatMessageSpy).toHaveBeenCalledTimes(1);
        expect(player2SendChatMessageSpy).toHaveBeenCalledTimes(1);
    });
});
