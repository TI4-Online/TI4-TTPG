require("../../../global");
const assert = require("assert");
const { BagDraft } = require("./bag-draft");

it("draftFactions", () => {
    const count = 13;
    const factions = BagDraft.draftFactions(count);
    assert.equal(factions.length, count);
});

it("draftSystems", () => {
    const redCount = 13;
    const blueCount = 15;
    const red = BagDraft.draftSystems(redCount, true);
    const blue = BagDraft.draftSystems(blueCount, false);
    assert.equal(red.length, redCount);
    assert.equal(blue.length, blueCount);
    red.forEach((system) => assert(system.red));
    blue.forEach((system) => assert(system.blue));
});
