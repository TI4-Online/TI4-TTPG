require("../../../global"); // declare world.TI4
const assert = require("assert");
const { FactionAliases } = require("../../faction/faction-aliases");
const { SCPT_DRAFTS } = require("./scpt-draft.data");
const { world } = require("../../../wrapper/api");

it("faction names", () => {
    for (const scptDraft of SCPT_DRAFTS) {
        for (const factionSet of scptDraft.factionSets) {
            const factionNames = factionSet.split("|");
            for (const factionName of factionNames) {
                const nsidName = FactionAliases.getNsid(factionName);
                if (!nsidName) {
                    console.log("bad name: " + factionName);
                }
                assert(nsidName);
                const faction = world.TI4.getFactionByNsidName(nsidName);
                assert(faction);
            }
        }
    }
});
