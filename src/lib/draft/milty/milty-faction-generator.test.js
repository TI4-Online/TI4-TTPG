require("../../../global"); // create world.TI4
const assert = require("assert");
const { MiltyFactionGenerator } = require("./milty-faction-generator");

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
