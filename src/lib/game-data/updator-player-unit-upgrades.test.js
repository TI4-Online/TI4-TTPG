require("../../global"); // register world.TI4
const assert = require("assert");
const UPDATOR = require("./updator-player-unit-upgrades");
const { MockCard, MockCardDetails, world } = require("../../wrapper/api");

it("player.unitUpgrades duplicate", () => {
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
                    metadata: "card.technology.unit_upgrade:base/carrier_2",
                }),
            ],
            position: playerDesks[0].center,
        })
    );
    // dup
    world.__addObject(
        new MockCard({
            allCardDetails: [
                new MockCardDetails({
                    metadata: "card.technology.unit_upgrade:base/carrier_2",
                }),
            ],
            position: playerDesks[0].center,
        })
    );

    UPDATOR(data);
    world.__clear();

    assert.deepEqual(data.players[0].unitUpgrades, ["carrier"]);
});

it("faction tech", () => {
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
                        "card.technology.unit_upgrade.sol:base/advanced_carrier_2",
                }),
            ],
            position: playerDesks[0].center,
        })
    );

    UPDATOR(data);
    world.__clear();

    assert.deepEqual(data.players[0].unitUpgrades, ["carrier"]);
});
