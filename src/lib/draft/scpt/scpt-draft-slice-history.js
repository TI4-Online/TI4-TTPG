const assert = require("../../../wrapper/assert-wrapper");
const { SCPT_DRAFTS_2021 } = require("./scpt-draft-2021.data");
const { SCPT_DRAFTS_2022 } = require("./scpt-draft-2022.data");
const { SCPT_DRAFTS_2023 } = require("./scpt-draft-2023.data");
const { SCPT_DRAFTS_2024 } = require("./scpt-draft-2024.data");

class ScptDraftSliceHistory {
    getPrelims() {
        const allPrelims = [];

        for (const candidates of SCPT_DRAFTS_2021) {
            if (candidates.name.toLowerCase().includes("prelim")) {
                allPrelims.push({
                    name: "Patreon 3 (2021)",
                    slices: candidates.slices,
                    labels: candidates.labels,
                });
            }
        }
        for (const candidates of SCPT_DRAFTS_2022) {
            if (candidates.name.toLowerCase().includes("prelim")) {
                allPrelims.push({
                    name: "Patreon 4 (2022)",
                    slices: candidates.slices,
                    labels: candidates.labels,
                });
            }
        }
        for (const candidates of SCPT_DRAFTS_2023) {
            if (candidates.name.toLowerCase().includes("prelim")) {
                allPrelims.push({
                    name: "Patreon 5 (2023)",
                    slices: candidates.slices,
                    labels: candidates.labels,
                });
            }
        }
        for (const candidates of SCPT_DRAFTS_2024) {
            if (candidates.name.toLowerCase().includes("prelim")) {
                allPrelims.push({
                    name: "Patreon 6 (2024)",
                    slices: candidates.slices,
                    labels: candidates.labels,
                });
            }
        }

        for (const prelims of allPrelims) {
            //console.log(JSON.stringify(prelims, null, 3));
            assert(typeof prelims.name === "string");
            assert(prelims.name.length > 0);
            assert(typeof prelims.slices === "string");
            assert(prelims.slices.length > 0);
            assert(typeof prelims.labels === "string");
            assert(prelims.labels.length > 0);
        }

        const index = Math.floor(Math.random() * allPrelims.length);
        const result = allPrelims[index];

        return result;
    }
}

module.exports = { ScptDraftSliceHistory };
