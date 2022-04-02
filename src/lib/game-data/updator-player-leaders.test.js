require("../../global"); // register world.TI4
const assert = require("assert");
const UPDATOR = require("./updator-player-leaders");
const { MockCard, MockCardDetails, world } = require("../../wrapper/api");

it("player.leaders", () => {
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
                    metadata: "card.leader.hero.ul:pok/ul_the_progenitor",
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
                    metadata: "card.leader.commander.naalu:pok/maban",
                }),
            ],
            faceUp: true,
            position: playerDesks[0].center,
        })
    );

    UPDATOR(data);
    world.__clear();

    assert.deepEqual(data.players[0].leaders, {
        commander: "unlocked",
        hero: "locked",
    });
});
