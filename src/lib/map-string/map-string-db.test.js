require("../../global"); // setup world.TI4
const assert = require("assert");
const { MapStringLoad } = require("./map-string-load");
const MapStringParser = require("./map-string-parser");
const { world } = require("../../wrapper/api");

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

it("string db hs count", () => {
    for (const entry of MAP_STRING_DB) {
        const parsedMapString = MapStringParser.parse(entry.mapstring);
        assert(parsedMapString);
        const numHomeSystems = parsedMapString.filter(
            (entry) => entry.tile === 0
        ).length;
        assert(typeof numHomeSystems === "number");

        // Extract player count from name.
        const m = entry.name.match(/\[(\d)p/);
        if (!m) {
            throw new Error(entry.name);
        }
        const playerCount = parseInt(m[1]);
        if (playerCount !== numHomeSystems) {
            const msg = `HS count mismatch ${JSON.stringify(entry)}`;
            throw new Error(msg);
        }
        assert.equal(playerCount, numHomeSystems);
    }
});

it("atlas db hs count", () => {
    for (const entry of MAP_ATLAS_DB) {
        const parsedMapString = MapStringParser.parse(entry.mapstring);
        assert(parsedMapString);
        const numHomeSystems = parsedMapString.filter(
            (entry) => entry.tile === 0
        ).length;
        if (entry.playerCount !== numHomeSystems) {
            const msg = `HS count mismatch ${JSON.stringify(entry)}`;
            throw new Error(msg);
        }
        assert.equal(entry.playerCount, numHomeSystems);
    }
});

it("string db no defined hs", () => {
    for (const dbEntry of MAP_STRING_DB) {
        const parsedMapString = MapStringParser.parse(dbEntry.mapstring);
        assert(parsedMapString);
        const homes = [];
        for (const entry of parsedMapString) {
            const system = world.TI4.getSystemByTileNumber(entry.tile);
            if (system && system.home) {
                homes.push(entry.tile);
            }
        }
        if (homes.length > 0) {
            throw new Error(
                `home systems (${JSON.stringify(homes)}) in "${
                    dbEntry.name
                }", string "${dbEntry.mapstring}"`
            );
        }
    }
});

it("atlas db no defined hs", () => {
    for (const dbEntry of MAP_ATLAS_DB) {
        const parsedMapString = MapStringParser.parse(dbEntry.mapstring);
        assert(parsedMapString);
        const homes = [];
        for (const entry of parsedMapString) {
            const system = world.TI4.getSystemByTileNumber(entry.tile);
            if (system && system.home) {
                homes.push(entry.tile);
            }
        }
        if (homes.length > 0) {
            throw new Error(
                `home systems (${JSON.stringify(homes)}) in "${
                    dbEntry.name
                }", string "${dbEntry.mapstring}"`
            );
        }
    }
});
