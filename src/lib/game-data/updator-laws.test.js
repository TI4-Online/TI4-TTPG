require("../../global"); // register world.TI4
const assert = require("assert");
const UPDATOR = require("./updator-laws");
const { MockCard, MockCardDetails, world } = require("../../wrapper/api");

it("laws", () => {
    const playerDesks = world.TI4.getAllPlayerDesks();
    const data = {
        players: playerDesks.map((desk) => {
            return { color: desk.colorName };
        }),
    };

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
