require("../../global"); // setup world.TI4
const assert = require("assert");
const { MapStringLoad } = require("./map-string-load");
const MAP_STRING_DB = require("./map-string-db.json");

it("db", () => {
    for (const entry of MAP_STRING_DB) {
        const success = MapStringLoad.load(entry.mapstring);
        if (!success) {
            const msg = `Load failed for "${entry.name}", string "${entry.mapstring}"`;
            throw new Error(msg);
        }
        assert(success);
    }
});
