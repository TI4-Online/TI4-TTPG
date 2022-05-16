require("../../../global"); // declare world.TI4
const assert = require("../../../wrapper/assert-wrapper");
const { SCPT_DRAFTS, FACTION_NAME_TO_NSID_NAME } = require("./scpt-draft.data");
const { world } = require("../../../wrapper/api");

it("faction names", () => {
    for (const scptDraft of SCPT_DRAFTS) {
        for (const factionSet of scptDraft.factionSets) {
            const factionNames = factionSet.split("|");
            for (const factionName of factionNames) {
                const nsidName = FACTION_NAME_TO_NSID_NAME[factionName];
                assert(nsidName);
                const faction = world.TI4.getFactionByNsidName(nsidName);
                assert(faction);
            }
        }
    }
});
