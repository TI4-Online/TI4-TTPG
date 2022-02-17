const assert = require("../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../lib/object-namespace");
const { Spawn } = require("./spawn/spawn");
const { Rotator, Vector, world } = require("../wrapper/api");
const { AbstractSetup } = require("./abstract-setup");

class SetupSystemTiles extends AbstractSetup {
    constructor() {
        super();
    }

    setup() {
        const pos = new Vector(0, 100, world.getTableHeight() + 5);
        const rot = new Rotator(0, 0, 0);
        const bag = Spawn.spawnGenericContainer(pos, rot);

        const nsids = Spawn.getAllNSIDs().filter((nsid) => {
            if (!nsid.startsWith("tile.system")) {
                return false;
            }
            const parsed = ObjectNamespace.parseNsid(nsid);
            if (parsed.source.startsWith("homebrew")) {
                return false;
            }
            // Ignore home systems.
            const tile = Number.parseInt(parsed.name);
            const system = world.TI4.getSystemByTileNumber(tile);
            if (!system) {
                return false; // "0" reserved for home sytem marking
            }
            if (system.raw.home) {
                return false;
            }
            return true;
        });
        for (const nsid of nsids) {
            const above = pos.add([0, 0, 20]);
            const obj = Spawn.spawn(nsid, above, rot);

            // Sanity check system tile before adding it.
            const parsed = ObjectNamespace.parseSystemTile(obj);
            assert(parsed);
            const system = world.TI4.getSystemByTileNumber(parsed.tile);
            assert(system);
            assert(!system.raw.home);

            bag.addObjects([obj]);
        }
    }

    clean() {
        for (const obj of world.getAllObjects()) {
            // Look inside containers too.
            if (!ObjectNamespace.isSystemTile(obj)) {
                continue;
            }
            const parsed = ObjectNamespace.parseSystemTile(obj);
            const system = world.TI4.getSystemByTileNumber(parsed.tile);
            if (system && system.raw.home) {
                continue;
            }
            const container = obj.getContainer();
            if (container) {
                const above = container.getPosition().add([0, 0, 10]);
                if (container.take(obj, above)) {
                    obj.destroy();
                }
            } else {
                obj.destroy();
            }
        }
    }
}

module.exports = { SetupSystemTiles };
