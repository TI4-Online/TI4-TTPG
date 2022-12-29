require("../../global"); // register world.TI4
const assert = require("assert");
const UPDATOR = require("./updator-player-unit-modifiers");
const {
    MockCard,
    MockCardDetails,
    MockGameObject,
    world,
} = require("../../wrapper/api");

it("player.unitModifiers", () => {
    const playerDesks = world.TI4.getAllPlayerDesks();
    const data = {
        players: playerDesks.map((desk) => {
            return { color: desk.colorName };
        }),
    };

    const objects = [
        new MockGameObject({
            templateMetadata: "sheet.faction:base/arborec",
            position: playerDesks[0].center,
        }),
        new MockCard({
            allCardDetails: [
                new MockCardDetails({
                    metadata: "card.action:base/morale_boost.1",
                }),
            ],
            position: playerDesks[0].center,
        }),
        new MockCard({
            allCardDetails: [
                new MockCardDetails({
                    metadata: "card.leader.commander.l1z1x:pok/2ram",
                }),
            ],
            position: playerDesks[0].center,
        }),
        // duplicate
        new MockCard({
            allCardDetails: [
                new MockCardDetails({
                    metadata: "card.leader.commander.l1z1x:pok/2ram",
                }),
            ],
            position: playerDesks[0].center,
        }),
    ];

    world.__clear();
    for (const obj of objects) {
        world.__addObject(obj);
    }
    UPDATOR(data);
    world.__clear();

    assert.deepEqual(data.players[0].unitModifiers, [
        { localeName: "morale_boost", name: "Morale Boost" },
        { localeName: "2ram", name: "2RAM" },
    ]);
});
