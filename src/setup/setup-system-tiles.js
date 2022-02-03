const assert = require("../wrapper/assert");
const { ObjectNamespace } = require("../lib/object-namespace");
const { Spawn } = require("./spawn/spawn");
const { System } = require("../lib/system/system");
const { Rotator, Vector, world } = require("../wrapper/api");

class SetupSystemTiles {
    static setup() {
        const nsids = Spawn.getAllNSIDs().filter((nsid) => {
            const parsedNsid = ObjectNamespace.parseNsid(nsid);
            return (
                parsedNsid.type.startsWith("tile.system") &&
                !parsedNsid.source.startsWith("homebrew")
            );
        });
        for (const nsid of nsids) {
            const pos = new Vector(0, 0, world.getTableHeight());
            const rot = new Rotator(0, 0, 0);
            const obj = Spawn.spawn(nsid, pos, rot);
            const parsed = ObjectNamespace.parseSystemTile(obj);
            assert(parsed);
            const system = System.getByTile(parsed.tile);
            assert(system);
        }
    }
}

module.exports = { SetupSystemTiles };
