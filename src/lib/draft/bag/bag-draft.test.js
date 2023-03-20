require("../../../global");
const assert = require("assert");
const { BagDraft } = require("./bag-draft");

it("draftFactions", () => {
    const count = 13;
    const factions = BagDraft.draftFactions(count, false);
    assert.equal(factions.length, count);
});
