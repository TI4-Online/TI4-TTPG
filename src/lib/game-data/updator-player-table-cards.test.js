require("../../global"); // register world.TI4
const assert = require("assert");
const UPDATOR = require("./updator-player-table-cards");
const { MockCard, MockCardDetails, world } = require("../../wrapper/api");

it("player.tech", () => {
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
                    metadata:
                        "card.exploration.frontier:pok/enigmatic_device.2",
                    name: "Enigmatic Device (2)",
                }),
            ],
            position: playerDesks[0].center,
        })
    );

    UPDATOR(data);
    world.__clear();

    assert.deepEqual(data.players[0].tableCards, ["Enigmatic Device (2)"]);
});
