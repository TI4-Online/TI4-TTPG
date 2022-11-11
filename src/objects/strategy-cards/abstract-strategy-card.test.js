require("../../global"); // create globalEvents.TI4
const assert = require("assert");
const {
    globalEvents,
    world,
    MockColor,
    MockGameObject,
    MockPlayer,
} = require("../../mock/mock-api");
const { AbstractStrategyCard } = require("./abstract-strategy-card");

it("static addPlayButton", () => {
    const gameObject = new MockGameObject({
        templateMetadata: "tile.strategy:base/leadership",
    });
    AbstractStrategyCard.addPlayButton(gameObject);
});

it("static addOnMovementStoppedTrigger", () => {
    const gameObject = new MockGameObject({
        templateMetadata: "tile.strategy:base/leadership",
    });
    AbstractStrategyCard.addOnMovementStoppedTrigger(gameObject);
});

it("constructor", () => {
    const gameObject = new MockGameObject({
        templateMetadata: "tile.strategy:base/leadership",
    });
    new AbstractStrategyCard(gameObject);
});

it("setColor", () => {
    const gameObject = new MockGameObject({
        templateMetadata: "tile.strategy:base/leadership",
    });
    const abstractStrategyCard = new AbstractStrategyCard(gameObject);
    abstractStrategyCard.setColor(new MockColor(1, 1, 1));
});

it("setBodyWidgetFactory", () => {
    const gameObject = new MockGameObject({
        templateMetadata: "tile.strategy:base/leadership",
    });
    const abstractStrategyCard = new AbstractStrategyCard(gameObject);
    abstractStrategyCard.setBodyWidgetFactory(
        (verticalBox, playerDesk, closeHandler) => {}
    );
});

it("count body widgets created by play", () => {
    const gameObject = new MockGameObject({
        templateMetadata: "tile.strategy:base/leadership",
    });
    let numBodyWidgetsCreated = 0;
    const abstractStrategyCard = new AbstractStrategyCard(gameObject);
    abstractStrategyCard.setBodyWidgetFactory((verticalBox, playerDesk) => {
        numBodyWidgetsCreated += 1;
    });
    const player = new MockPlayer();
    globalEvents.TI4.onStrategyCardPlayed.trigger(gameObject, player);
    assert.equal(numBodyWidgetsCreated, world.TI4.config.playerCount);
});
