const assert = require("../../wrapper/assert-wrapper");
const { AuxData } = require("./auxdata");

it("constructor", () => {
    const auxData = new AuxData(7);
    assert.equal(auxData.playerSlot, 7);
});
