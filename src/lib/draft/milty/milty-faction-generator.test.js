require("../../../global"); // create world.TI4
const assert = require("assert");
const { MiltyFactionGenerator } = require("./milty-faction-generator");

it("generate", () => {
    const factionGenerator = new MiltyFactionGenerator();
    const factions = factionGenerator.generate();
    assert(factionGenerator.getCount() > 0);
    assert.equal(factions.length, factionGenerator.getCount());
});
