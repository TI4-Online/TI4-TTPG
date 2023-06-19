require("../../global"); // create globalEvents.TI4
const assert = require("assert");
const UPDATOR = require("./updator-player-timer");

it("playerTimer", () => {
    const data = {};

    UPDATOR(data);

    assert.deepEqual(data, { playerTimer: {} });
});
