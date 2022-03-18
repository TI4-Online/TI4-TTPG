require("../../global"); // register world.TI4
const assert = require("assert");
const UPDATOR = require("./updator-round");
const {
    MockCard,
    MockCardDetails,
    MockGameObject,
    world,
} = require("../../wrapper/api");

it("round", () => {
    const data = {};

    world.__clear();
    world.__addObject(
        new MockGameObject({
            templateMetadata: "mat:base/objectives_1",
        })
    );
    world.__addObject(
        new MockGameObject({
            templateMetadata: "mat:base/objectives_2",
        })
    );
    world.__addObject(
        new MockCard({
            allCardDetails: [
                new MockCardDetails({
                    metadata: "card.objective.public_1:base/a",
                }),
            ],
        })
    );
    world.__addObject(
        new MockCard({
            allCardDetails: [
                new MockCardDetails({
                    metadata: "card.objective.public_1:base/b",
                }),
            ],
        })
    );
    world.__addObject(
        new MockCard({
            allCardDetails: [
                new MockCardDetails({
                    metadata: "card.objective.public_1:base/c",
                }),
            ],
        })
    );
    UPDATOR(data);
    world.__clear();

    assert.equal(data.round, 2);
});
