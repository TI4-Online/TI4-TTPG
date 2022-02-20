require("../global"); // create globalEvents.TI4
const assert = require("assert");
const { PlayerDesk } = require("./player-desk");
const { Color, MockPlayer, world } = require("../wrapper/api");

it("static getPlayerDesks", () => {
    const player = new MockPlayer();
    const defaultPlayerCount = world.TI4.getPlayerCount();
    try {
        let playerDesks = PlayerDesk.getAllPlayerDesks();
        assert.equal(playerDesks.length, defaultPlayerCount);
        assert(playerDesks[0] instanceof PlayerDesk);

        for (let i = 2; i < 8; i++) {
            world.TI4.setPlayerCount(i, player);
            playerDesks = PlayerDesk.getAllPlayerDesks();
            assert.equal(playerDesks.length, i);
        }
    } finally {
        world.TI4.setPlayerCount(defaultPlayerCount, player);
    }
});

it("static getClosest", () => {
    for (const playerDesk of PlayerDesk.getAllPlayerDesks()) {
        const closestDesk = PlayerDesk.getClosest(playerDesk.pos);
        assert.equal(closestDesk, playerDesk);
    }
});

it("color", () => {
    const playerDesk = PlayerDesk.getAllPlayerDesks()[0];
    assert(typeof playerDesk.colorName === "string");
    assert(playerDesk.color instanceof Color);
});
it("getColorOptions", () => {
    const playerDesk = PlayerDesk.getAllPlayerDesks()[0];
    const options = playerDesk.getColorOptions();
    assert(options.length > 0);
});

it("changeColor", () => {
    const playerDesk1 = PlayerDesk.getAllPlayerDesks()[0];
    const playerDesk2 = PlayerDesk.getAllPlayerDesks()[1];
    const colorName1 = playerDesk1.colorName;
    const colorName2 = playerDesk2.colorName;
    playerDesk1.changeColor(colorName2, new Color(1, 1, 1, 1));
    assert.equal(playerDesk1.colorName, colorName2);
    assert.equal(playerDesk2.colorName, colorName1); // swapped
});
