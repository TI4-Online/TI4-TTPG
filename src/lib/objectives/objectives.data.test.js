require("../../global");
const assert = require("assert");
const {
    NSID_OBJECTIVE_PROGRESS,
    OBJECTIVE_NAME_ABBREVIATIONS,
} = require("./objectives.data");
const { world } = require("../../wrapper/api");

it("structure", () => {
    for (const [nsid, getProgress] of Object.entries(NSID_OBJECTIVE_PROGRESS)) {
        assert(typeof nsid === "string");
        assert(typeof getProgress === "function");

        const abbr = OBJECTIVE_NAME_ABBREVIATIONS[nsid];
        assert(typeof abbr === "string");

        const { header, values } = getProgress();
        assert(typeof header === "string");
        assert(Array.isArray(values));
        assert.equal(values.length, world.TI4.config.playerCount);

        for (const valueEntry of values) {
            const { value, success } = valueEntry;
            assert(typeof value === "number" || typeof value === "string");
            assert(typeof success === "boolean");

            if (typeof value === "string" && value.length > 1) {
                //console.log(`${nsid} (${abbr}) : ${header} : ${value}`);
                break;
            }
        }
    }
});
