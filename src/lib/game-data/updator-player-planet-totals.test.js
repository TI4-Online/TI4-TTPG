require("../../global"); // register world.TI4
const assert = require("assert");
const UPDATOR = require("./updator-player-planet-totals");
const { MockCard, MockCardDetails, world } = require("../../wrapper/api");

it("player.planetTotals", () => {
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
                    metadata: "card.planet:base/meer",
                }),
            ],
            faceUp: false,
            position: playerDesks[0].center,
        })
    );
    world.__addObject(
        new MockCard({
            allCardDetails: [
                new MockCardDetails({
                    metadata: "card.planet:base/mecatol_rex",
                }),
            ],
            faceUp: false,
            position: playerDesks[0].center,
        })
    );
    world.__addObject(
        new MockCard({
            allCardDetails: [
                new MockCardDetails({
                    metadata: "card.planet:pok/mallice",
                }),
            ],
            faceUp: true,
            position: playerDesks[0].center,
        })
    );

    UPDATOR(data);
    world.__clear();

    assert.deepEqual(data.players[0].planetTotals, {
        influence: { avail: 3, total: 13 },
        resources: { avail: 0, total: 1 },
        techs: { blue: 0, red: 1, green: 0, yellow: 0 },
        traits: { cultural: 1, hazardous: 1, industrial: 0 },
        legendary: 1,
    });
});
