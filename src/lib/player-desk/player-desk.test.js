require("../../global"); // create globalEvents.TI4
const assert = require("assert");
const { ColorUtil } = require("../color/color-util");
const { PlayerDesk } = require("./player-desk");
const { MockPlayer, world } = require("../../wrapper/api");

it("static getPlayerDesks", () => {
    const player = new MockPlayer();
    const defaultPlayerCount = world.TI4.config.playerCount;
    try {
        let playerDesks = PlayerDesk.getAllPlayerDesks();
        assert.equal(playerDesks.length, defaultPlayerCount);
        assert(playerDesks[0] instanceof PlayerDesk);

        for (let i = 2; i < 8; i++) {
            world.TI4.config.setPlayerCount(i, player);
            playerDesks = PlayerDesk.getAllPlayerDesks();
            assert.equal(playerDesks.length, i);
        }
    } finally {
        world.TI4.config.setPlayerCount(defaultPlayerCount, player);
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
    assert(ColorUtil.isColor(playerDesk.color));
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
    playerDesk1.changeColor(colorName2);
    assert.equal(playerDesk1.colorName, colorName2);
    assert.equal(playerDesk2.colorName, colorName1); // swapped
    let plasticColorHex = ColorUtil.colorToHex(playerDesk1.plasticColor);
    assert.equal(plasticColorHex, "#39c1ff");

    const overridePlasticColorHex = "#123456";
    playerDesk1.changeColor(colorName2, overridePlasticColorHex);
    plasticColorHex = ColorUtil.colorToHex(playerDesk1.plasticColor);
    assert.equal(plasticColorHex, overridePlasticColorHex);
});

it("setEliminated", () => {
    const playerDesk = PlayerDesk.getAllPlayerDesks()[0];
    assert.equal(playerDesk.eliminated, false);
    playerDesk.setEliminated(true);
    assert.equal(playerDesk.eliminated, true);
    playerDesk.setEliminated(false);
    assert.equal(playerDesk.eliminated, false);
});
