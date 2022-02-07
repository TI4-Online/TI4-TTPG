const assert = require("assert");
const { globalEvents, MockButton, MockGameObject, MockGameWorld, MockPlayer, MockVerticalBox } = require("../../mock/mock-api");
const { broadcastMessage, createStrategyCardUi, onUiClosedClicked } = require("./strategy-card");
const TriggerableMulticastDelegate = require("../../lib/triggerable-multicast-delegate");

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

describe("creating a strategy card", () => {
    beforeEach(() => {
        const red = {r: 1, g: 0, b: 0};
        const player = new MockPlayer({playerColor: red});
        global.world = new MockGameWorld({ allPlayers: [player]});
    });

    it("with a widget", () => {
        let widget = new MockVerticalBox();
        let gameObject = new MockGameObject();
        jest.spyOn( global.world, "createObjectFromTemplate").mockReturnValueOnce(gameObject);

        createStrategyCardUi(gameObject, widget);

        assert(gameObject.getUIs().length === 1);
    });
});

describe("when the close button is clicked in a players selection", () => {
    let player1, player1Card, player1Button, player2, player2Card, player2Button, widget;

    beforeEach(() => {
        const red = {r: 1, g: 0, b: 0};
        const green = {r: 0, g: 1, b: 0};
        player1 = new MockPlayer({playerColor: red, slot: 1});
        player2 = new MockPlayer({playerColor: green, slot: 2});
        global.world = new MockGameWorld({ allPlayers: [player1, player2]});

        player1Card = new MockGameObject({owningPlayerSlot: 1});
        player1Button = new MockButton({owningObject: player1Card});
        player2Card = new MockGameObject({owningPlayerSlot: 2});
        player2Button = new MockButton({owningObject: player2Card});
        widget = new MockVerticalBox();

        jest.spyOn( global.world, "createObjectFromTemplate")
            .mockReturnValueOnce(player1Card)
            .mockReturnValueOnce(player2Card);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("in case the owner clicked the button, then the global event triggers", () => {
        const card = new MockGameObject({id: "card1"});
        const globalEventTriggerSpy = jest.spyOn(globalEvents.TI4.onStrategyCardSelectionDone, "trigger");
        createStrategyCardUi(card, widget);

        onUiClosedClicked(player1Button, player1);

        expect(globalEventTriggerSpy).toHaveBeenCalledTimes(1);
    });

    it("in case the another player clicked the button, then the global event does not trigger", () => {
        const card = new MockGameObject({id: "card2"});
        const globalEventTriggerSpy = jest.spyOn(globalEvents.TI4.onStrategyCardSelectionDone, "trigger");
        createStrategyCardUi(card, widget);

        onUiClosedClicked(player1Button, player2);

        expect(globalEventTriggerSpy).toHaveBeenCalledTimes(0);
    });

    it("in case all players have resolved the strategy card, a message is broadcast", () => {
        const card = new MockGameObject({id: "card3"});
        const player1SendChatMessageSpy = jest.spyOn(player1, "sendChatMessage");
        const player2SendChatMessageSpy = jest.spyOn(player2, "sendChatMessage");
        createStrategyCardUi(card, widget);

        onUiClosedClicked(player2Button, player2);
        onUiClosedClicked(player1Button, player1);

        expect(player1SendChatMessageSpy).toHaveBeenCalledTimes(1);
        expect(player2SendChatMessageSpy).toHaveBeenCalledTimes(1);
    });
});
