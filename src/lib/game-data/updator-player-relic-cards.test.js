require("../../global"); // register world.TI4
const assert = require("assert");
const UPDATOR = require("./updator-player-relic-cards");
const { MockCard, MockCardDetails, world } = require("../../wrapper/api");

it("player.relicCards", () => {
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
                    metadata: "card.relic:codex.affinity/nanoforge",
                }),
            ],
            faceUp: false,
            position: playerDesks[0].center,
        })
    );

    UPDATOR(data);
    world.__clear();

    assert.deepEqual(data.players[0].relicCards, [
        "card.relic:codex.affinity/nanoforge",
    ]);
});
