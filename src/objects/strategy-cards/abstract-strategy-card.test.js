require("../../global"); // create globalEvents.TI4
const { MockColor, MockGameObject } = require("../../mock/mock-api");
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
        (playerDesk, strategyCardObj) => {}
    );
});
