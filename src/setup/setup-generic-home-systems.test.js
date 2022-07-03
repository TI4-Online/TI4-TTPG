require("../global"); // setup world.TI4, etc
const assert = require("assert");
const { SetupGenericHomeSystems } = require("./setup-generic-home-systems");
const { world } = require("../wrapper/api");

it("getPlayerSlotToHomeSystemIndex", () => {
    for (let i = 1; i < 9; i++) {
        world.TI4.config.setPlayerCount(i);
        const desks = world.TI4.getAllPlayerDesks();
        assert.equal(i, desks.length);
        const playerSlotToHomeSystemIndex =
            SetupGenericHomeSystems.getPlayerSlotToHomeSystemIndex();
        for (let j = 1; j < i; j++) {
            const playerSlot = desks[j].playerSlot;
            assert(typeof playerSlot === "number");
            const v = playerSlotToHomeSystemIndex[playerSlot];
            assert(typeof v === "number");
            assert(v >= 0);
            assert(v <= i);
        }
    }
    world.TI4.config.setPlayerCount(6);
});

it("getHomeSystemPosition", () => {
    for (let i = 1; i < 9; i++) {
        world.TI4.config.setPlayerCount(i);
        const desks = world.TI4.getAllPlayerDesks();
        assert.equal(i, desks.length);
        for (let j = 1; j < i; j++) {
            const playerDesk = desks[j];
            assert(playerDesk);
            const pos =
                SetupGenericHomeSystems.getHomeSystemPosition(playerDesk);
            assert(pos);
            assert(typeof pos.x === "number");
        }
    }
    world.TI4.config.setPlayerCount(6);
});
