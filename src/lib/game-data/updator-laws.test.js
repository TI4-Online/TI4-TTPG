require("../../global"); // register world.TI4
const assert = require("assert");
const UPDATOR = require("./updator-laws");
const { MockCard, MockCardDetails, world } = require("../../wrapper/api");

it("laws", () => {
    const data = {};

    world.__clear();
    world.__addObject(
        new MockCard({
            allCardDetails: [
                new MockCardDetails({
                    name: "Representative Government",
                    metadata: "card.agenda:pok/representative_government",
                }),
            ],
        })
    );
    UPDATOR(data);
    world.__clear();

    assert.deepEqual(data.laws, ["Representative Government"]);
});
