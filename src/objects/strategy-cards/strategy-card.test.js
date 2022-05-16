require("../../global"); // create globalEvents.TI4
const {
    globalEvents,
    world,
    Color,
    MockButton,
    MockGameObject,
    MockPlayer,
    MockVerticalBox,
} = require("../../mock/mock-api");
const {
    onUiClosedClicked,
    RegisterStrategyCardUI,
} = require("./strategy-card");

const red = new Color({ r: 1, g: 0, b: 0 });
const green = new Color({ r: 0, g: 1, b: 0 });

const player1 = new MockPlayer({
    name: "player1",
    playerColor: red,
    slot: 1,
});

const player2 = new MockPlayer({
    name: "player2",
    playerColor: green,
    slot: 2,
});

world.__setPlayers([player1, player2]);

describe("when a strategy card UI is created", () => {
    var buttons, card, index, widgetFactory;

    beforeEach(() => {
        index = 0;
        card = new MockGameObject({
            id: "card",
        });
        buttons = [
            new MockButton({ text: "button 0" }),
            new MockButton({ text: "button 1" }),
        ];

        widgetFactory = function () {
            let widget = new MockVerticalBox();
            widget.addChild(buttons[index]);
            index++;
            return widget;
        };

        world.TI4.config.setPlayerCount(2);
        world.TI4.getAllPlayerDesks()[0].seatPlayer(player1);
        world.TI4.getAllPlayerDesks()[1].seatPlayer(player2);
    });

    afterEach(() => {
        card.destroy();
        jest.clearAllMocks();
    });

    it("by calling the RegisterStrategyCardUI and trigger the 'Play' event", () => {
        new RegisterStrategyCardUI()
            .setCard(card)
            .setWidgetFactory(widgetFactory)
            .setHeight(100)
            .register();

        const beforeCount = world.getUIs().length;
        globalEvents.TI4.onStrategyCardPlayed.trigger(card, player1);

        // one UI per player
        expect(world.getUIs().length).toBe(beforeCount + 2);
        expect(
            world.getUIs()[beforeCount].widget.getChild().getChildren()[0]
        ).toBe(buttons[0]);
        expect(
            world.getUIs()[beforeCount + 1].widget.getChild().getChildren()[0]
        ).toBe(buttons[1]);
    });
});

describe("when the close button is clicked in a players selection", () => {
    let buttons, card, index;

    const widgetFactory = () => {
        let widget = new MockVerticalBox();
        widget.addChild(buttons[index]);
        index++;
        return widget;
    };

    beforeEach(() => {
        index = 0;
        buttons = [
            new MockButton({ text: "button 0" }),
            new MockButton({ text: "button 1" }),
        ];

        world.TI4.config.setPlayerCount(2);
        world.TI4.getAllPlayerDesks()[0].seatPlayer(player1);
        world.TI4.getAllPlayerDesks()[1].seatPlayer(player2);
    });

    afterEach(() => {
        card.destroy();
        jest.clearAllMocks();
    });

    it("in case the owner clicked the button, then the global event triggers", () => {
        card = new MockGameObject();
        const globalEventTriggerSpy = jest.spyOn(
            globalEvents.TI4.onStrategyCardSelectionDone,
            "trigger"
        );
        new RegisterStrategyCardUI()
            .setCard(card)
            .setWidgetFactory(widgetFactory)
            .setHeight(100)
            .register();
        globalEvents.TI4.onStrategyCardPlayed.trigger(card, player1);

        onUiClosedClicked(buttons[0], player1);

        expect(globalEventTriggerSpy).toHaveBeenCalledTimes(1);
    });

    // For the moment anyone can close a strategy card window.  Enable this test if that changes.
    // it("in case the another player clicked the button, then the global event does not trigger", () => {
    //     card = new MockGameObject();
    //     const globalEventTriggerSpy = jest.spyOn(
    //         globalEvents.TI4.onStrategyCardSelectionDone,
    //         "trigger"
    //     );
    //     new RegisterStrategyCardUI()
    //         .setCard(card)
    //         .setWidgetFactory(widgetFactory)
    //         .setHeight(100)
    //         .register();
    //     globalEvents.TI4.onStrategyCardPlayed.trigger(card, player1);

    //     onUiClosedClicked(buttons[0], player2);

    //     expect(globalEventTriggerSpy).toHaveBeenCalledTimes(0);
    // });

    it("in case all players have resolved the strategy card, a message is broadcast", () => {
        card = new MockGameObject();
        const player1SendChatMessageSpy = jest.spyOn(
            player1,
            "sendChatMessage"
        );
        const player2SendChatMessageSpy = jest.spyOn(
            player2,
            "sendChatMessage"
        );
        new RegisterStrategyCardUI()
            .setCard(card)
            .setWidgetFactory(widgetFactory)
            .setHeight(100)
            .register();
        globalEvents.TI4.onStrategyCardPlayed.trigger(card, player1);

        onUiClosedClicked(buttons[1], player2);
        onUiClosedClicked(buttons[0], player1);

        expect(player1SendChatMessageSpy).toHaveBeenCalledTimes(1);
        expect(player2SendChatMessageSpy).toHaveBeenCalledTimes(1);
    });
});

describe("when registering a strategy card", () => {
    let card, widgetFactory, onStrategyCardPlayed, onStrategyCardSelectionDone;

    beforeEach(() => {
        card = new MockGameObject();
        widgetFactory = jest.fn(() => new MockGameObject());
        onStrategyCardPlayed = jest.fn();
        onStrategyCardSelectionDone = jest.fn();
    });

    afterEach(() => {
        card.destroy();
    });

    it("and the play button is pressed as well as a player UI is closed", () => {
        const before = globalEvents.TI4.onStrategyCardPlayed._delegates.length;
        new RegisterStrategyCardUI()
            .setCard(card)
            .setWidgetFactory(widgetFactory)
            .setHeight(100)
            .setColor(new Color(1, 0, 0))
            .setOnStrategyCardPlayed(onStrategyCardPlayed)
            .setOnStrategyCardSelectionDone(onStrategyCardSelectionDone)
            .register();

        expect(globalEvents.TI4.onStrategyCardPlayed._delegates.length).toBe(
            before + 1
        );
        expect(
            globalEvents.TI4.onStrategyCardSelectionDone._delegates.length
        ).toBe(1);

        globalEvents.TI4.onStrategyCardPlayed.trigger(card, player1);

        // the widgetFactory is called once per player
        expect(widgetFactory).toBeCalledTimes(2);
        expect(onStrategyCardPlayed).toBeCalledTimes(1);
        expect(onStrategyCardSelectionDone).toBeCalledTimes(0);

        globalEvents.TI4.onStrategyCardSelectionDone.trigger(card, player1);

        expect(widgetFactory).toBeCalledTimes(2);
        expect(onStrategyCardPlayed).toBeCalledTimes(1);
        expect(onStrategyCardSelectionDone).toBeCalledTimes(1);
    });

    it("and the object is destroyed", () => {
        const before = globalEvents.TI4.onStrategyCardPlayed._delegates.length;
        new RegisterStrategyCardUI()
            .setCard(card)
            .setWidgetFactory(widgetFactory)
            .setHeight(100)
            .setColor(new Color(1, 0, 0))
            .setOnStrategyCardPlayed(onStrategyCardPlayed)
            .setOnStrategyCardSelectionDone(onStrategyCardSelectionDone)
            .register();

        card.destroy();

        expect(globalEvents.TI4.onStrategyCardPlayed._delegates.length).toBe(
            before
        );
        expect(
            globalEvents.TI4.onStrategyCardSelectionDone._delegates.length
        ).toBe(0);
    });
});
