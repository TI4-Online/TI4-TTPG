require("../global"); // setup world.TI4, etc
const assert = require("assert");
const {
    SetupGenericHomeSystems,
    HOME_SYSTEM_POSITIONS,
} = require("./setup-generic-home-systems");
const { world } = require("../wrapper/api");

it("getDeskIndexToHomeSystemIndex", () => {
    for (let playerCount = 1; playerCount < 9; playerCount++) {
        world.TI4.config.setPlayerCount(playerCount);
        const desks = world.TI4.getAllPlayerDesks();
        assert.equal(playerCount, desks.length);
        const deskIndexToHomeSystemIndex =
            SetupGenericHomeSystems.getDeskIndexToHomeSystemIndex();
        for (let playerIndex = 0; playerIndex < playerCount; playerIndex++) {
            const v = deskIndexToHomeSystemIndex[playerIndex];
            assert(typeof v === "number");
            assert(v >= 0);
            assert(v <= playerCount);
            const hexDataArray = HOME_SYSTEM_POSITIONS[playerCount];
            const hexData = hexDataArray[playerIndex];
            assert(hexData);
        }
    }
    world.TI4.config.setPlayerCount(6);
});

it("getHomeSystemPosition", () => {
    for (let playerCount = 1; playerCount < 9; playerCount++) {
        world.TI4.config.setPlayerCount(playerCount);
        const desks = world.TI4.getAllPlayerDesks();
        assert.equal(playerCount, desks.length);
        for (let playerIndex = 0; playerIndex < playerCount; playerIndex++) {
            const playerDesk = desks[playerIndex];
            assert(playerDesk);
            const pos =
                SetupGenericHomeSystems.getHomeSystemPosition(playerDesk);
            assert(pos);
            assert(typeof pos.x === "number");
        }
    }
    world.TI4.config.setPlayerCount(6);
});
