require("../../global"); // register world.TI4
const assert = require("assert");
const UPDATOR = require("./updator-player-hand-cards");
const {
    MockCard,
    MockCardDetails,
    MockCardHolder,
    world,
} = require("../../wrapper/api");

it("player-hand-cards", () => {
    const playerDesks = world.TI4.getAllPlayerDesks();
    const data = {
        players: playerDesks.map((desk) => {
            return { color: desk.colorName };
        }),
    };

    const holder = new MockCardHolder({
        owningPlayerSlot: playerDesks[0].playerSlot,
    });

    world.__clear();
    world.__addObject(
        new MockCard({
            allCardDetails: [
                new MockCardDetails({
                    metadata: "card.objective.secret:pok/become_a_martyr",
                    name: "Become a Martyr",
                }),
            ],
            holder: holder,
        })
    );
    world.__addObject(
        new MockCard({
            allCardDetails: [
                new MockCardDetails({
                    metadata:
                        "card.promissory.white:base/support_for_the_throne",
                    name: "Support for the Throne (White)",
                }),
            ],
            holder: holder,
        })
    );
    UPDATOR(data);
    world.__clear();

    assert.deepEqual(data.players[0].handCards, [
        "Become a Martyr",
        "Support for the Throne (White)",
    ]);
});
