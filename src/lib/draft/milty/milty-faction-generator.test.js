require("../../../global"); // create world.TI4
const assert = require("assert");
const { MiltyFactionGenerator } = require("./milty-faction-generator");
const { MockCard, MockVector, world } = require("../../../wrapper/api");

it("generate", () => {
    const factionGenerator = new MiltyFactionGenerator();
    const factions = factionGenerator.generate();
    assert(factionGenerator.getCount() > 0);
    assert.equal(factions.length, factionGenerator.getCount());
});

it("keleres", () => {
    const factionGenerator = new MiltyFactionGenerator().setCount(
        MiltyFactionGenerator.maxCount
    );

    const maxIterations = 1000;
    for (let i = 0; i < maxIterations; i++) {
        const factions = factionGenerator.generate();
        for (const faction of factions) {
            if (faction.nsidName.startsWith("keleres_")) {
                return;
            }
        }
    }
    throw new Error("not generating Keleres");
});

// it("keleres frequency", () => {
//     const factionGenerator = new MiltyFactionGenerator().setCount(8);

//     const iterations = 10000000;
//     const nsidToCount = {};
//     for (let i = 0; i < iterations; i++) {
//         const factions = factionGenerator.generate();
//         for (const faction of factions) {
//             const nsid = faction.nsidName;
//             nsidToCount[nsid] = (nsidToCount[nsid] || 0) + 1;
//         }
//     }
//     const report = [];
//     for (const [nsid, count] of Object.entries(nsidToCount)) {
//         const value = (count * 1) / iterations;
//         report.push(`${value} ${nsid}`);
//     }
//     console.log(report.join("\n"));
// });

it("getOnTableFactionCardNsidNames", () => {
    world.__clear();
    const nsids = [
        "card.faction_reference:base/jolnar",
        "card.faction_token:base/mentak",
        "card.faction_reference:codex.vigil/naalu.omega",
        "card.faction_reference:codex.vigil/naalu.omega", // dup
    ];
    for (const nsid of nsids) {
        const position = new MockVector(0, 0, world.getTableHeight());
        const card = MockCard.__create(nsid, position);
        world.__addObject(card);
    }

    const nsidNames = MiltyFactionGenerator.getOnTableFactionCardNsidNames();
    world.__clear();

    assert.deepEqual(nsidNames, ["jolnar", "mentak", "naalu"]);
});

it("mix on table", () => {
    world.__clear();
    const nsids = [
        "card.faction_reference:base/jolnar",
        "card.faction_token:base/mentak",
        "card.faction_reference:codex.vigil/naalu.omega",
    ];
    for (const nsid of nsids) {
        const position = new MockVector(0, 0, world.getTableHeight());
        const card = MockCard.__create(nsid, position);
        world.__addObject(card);
    }

    const factionGenerator = new MiltyFactionGenerator()
        .setCount(MiltyFactionGenerator.maxCount)
        .setFactionsFromCards(true);
    const factions = factionGenerator
        .generate()
        .map((faction) => faction.nsidName);
    world.__clear();

    const firstThree = factions.slice(0, 3);
    firstThree.sort();

    assert.deepEqual(firstThree, ["jolnar", "mentak", "naalu"]);
});
