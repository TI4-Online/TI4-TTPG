require("../../global"); // register world.TI4
const assert = require("assert");
const UPDATOR = require("./updator-unpicked-strategy-cards");
const { MockGameObject, world } = require("../../wrapper/api");

it("unpickedStrategyCards", () => {
    world.__clear();

    world.__addObject(
        new MockGameObject({
            templateMetadata: "mat:base/strategy_card",
        })
    );
    world.__addObject(
        new MockGameObject({
            templateMetadata: "tile.strategy:base/leadership",
        })
    );

    world.__addObject(
        new MockGameObject({
            templateMetadata: "token:base/tradegood_commodity_1",
        })
    );
    world.__addObject(
        new MockGameObject({
            templateMetadata: "token:base/tradegood_commodity_1",
        })
    );
    world.__addObject(
        new MockGameObject({
            templateMetadata: "token:base/tradegood_commodity_3",
        })
    );

    const data = {};
    UPDATOR(data);
    world.__clear();

    assert.deepEqual(data, { unpickedStrategyCards: { Leadership: 5 } });
});
