require("../../global"); // register world.TI4
const assert = require("assert");
const UPDATOR = require("./updator-player-tech");
const { MockCard, MockCardDetails, world } = require("../../wrapper/api");

it("tech", () => {
    world.__clear();

    const playerDesks = world.TI4.getAllPlayerDesks();

    world.__addObject(
        new MockCard({
            allCardDetails: [
                new MockCardDetails({
                    metadata: "card.technology.red:base/plasma_scoring",
                }),
            ],
            position: playerDesks[0].center,
        })
    );

    const data = {
        players: world.TI4.getAllPlayerDesks().map((desk) => {
            return { color: desk.colorName };
        }),
    };
    UPDATOR(data);
    world.__clear();

    assert.deepEqual(data.players[0].technologies, ["Plasma Scoring"]);
});
