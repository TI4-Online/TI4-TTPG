require("../../global"); // setup world.TI4
const assert = require("assert");
const { MapStringLoad } = require("./map-string-load");
const MAP_STRING_DB = require("./map-string-db.json");
const MAP_ATLAS_DB = require("./map-atlas-db.json");

// Convert TSV to JSON entries:
// cat atlas.tsv| grep "[0-9]" | sed -e "s/@/[at]/g" | tr '"' "'" | awk -F\t '{print "{ author:@" $2 "@, name: @" $3 "@, mapstring: @" $4 "@, sliceNames: @" $5 "@, playerCount: " $6 ", difficulty: @" $7 "@, attributes: @" $8 "@, comments: @" $9 "@},"}' | tr '@' '"' | sed -e "s/#[0-9][0-9][0-9]*//" | pbcopy

it("string db", () => {
    for (const entry of MAP_STRING_DB) {
        const success = MapStringLoad.load(entry.mapstring);
        if (!success) {
            const msg = `Load failed for "${entry.name}", string "${entry.mapstring}"`;
            throw new Error(msg);
        }
        assert(success);
    }
});

it("atlas db", () => {
    for (const entry of MAP_ATLAS_DB) {
        const success = MapStringLoad.load(entry.mapstring);
        if (!success) {
            const msg = `Load failed for "${entry.name}", string "${entry.mapstring}"`;
            throw new Error(msg);
        }
        assert(success);
    }
});
