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

    const cardNsids = [
        "card.objective.secret:pok/become_a_martyr",
        "card.promissory.white:base/support_for_the_throne",
        "card.promissory.ul:pok/terraform",
        "card.action:base/sabotage.1",
        "card.action:base/sabotage.2",
        "card.action:base/sabotage.3",
    ];

    world.__clear();
    for (const cardNsid of cardNsids) {
        world.__addObject(
            new MockCard({
                allCardDetails: [
                    new MockCardDetails({
                        metadata: cardNsid,
                    }),
                ],
                holder: holder,
            })
        );
    }
    UPDATOR(data);
    world.__clear();

    assert.deepEqual(data.players[0].handCards, [
        "card.objective.secret:pok/become_a_martyr",
        "card.promissory.white:base/support_for_the_throne",
        "card.promissory.ul:pok/terraform",
        "card.action:base/sabotage.1",
        "card.action:base/sabotage.2",
        "card.action:base/sabotage.3",
    ]);
});
