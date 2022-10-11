const assert = require("../../../wrapper/assert-wrapper");
const { MapStringLoad } = require("../../../lib/map-string/map-string-load");
const { ObjectNamespace } = require("../../../lib/object-namespace");
const { PremadeMapUI } = require("./premade-map-ui");
const { world } = require("../../../wrapper/api");
const { Broadcast } = require("../../../lib/broadcast");

class PremadeMap {
    constructor() {
        const onClickHandlers = {
            useMap: (mapStringDbEntry) => {
                this._useMap(mapStringDbEntry);
            },
        };
        this._ui = new PremadeMapUI(onClickHandlers);
    }

    getUI() {
        return this._ui;
    }

    _clear() {
        let tilesBag = false;
        for (const obj of world.getAllObjects()) {
            if (!ObjectNamespace.isSystemTile(obj)) {
                continue;
            }
            const container = obj.getContainer();
            if (container) {
                tilesBag = container;
                break;
            }
        }

        const clearedSet = new Set();
        for (const obj of world.TI4.getAllSystemTileObjects()) {
            const system = world.TI4.getSystemBySystemTileObject(obj);
            if (system.home) {
                continue;
            }
            if (!tilesBag || clearedSet.has(system.tile)) {
                obj.setTags(["DELETED_ITEMS_IGNORE"]);
                obj.destroy();
            } else {
                clearedSet.add(system.tile);
                tilesBag.addObjects([obj]);
            }
        }
    }

    _useMap(mapStringDbEntry) {
        const mapString = mapStringDbEntry.mapstring;
        assert(typeof mapString === "string");
        console.log(`PremadeMap._useMap`);

        let name = `"${mapStringDbEntry.name}"`;
        if (mapStringDbEntry.author && mapStringDbEntry.author.length > 0) {
            name = `${name} (${mapStringDbEntry.author})`;
        }

        let msg = [name];
        if (mapStringDbEntry.comments && mapStringDbEntry.comments.length > 0) {
            msg.push(`"${mapStringDbEntry.comments}"`);
        }
        msg = msg.join("\n");
        Broadcast.chatAll(msg, [1, 1, 0, 1]);

        // Clear now.  Wait a frame before building.
        this._clear();

        const build = () => {
            MapStringLoad.moveGenericHomeSystemTiles(mapString);
            MapStringLoad.load(mapString);
        };
        process.nextTick(build);
    }
}

module.exports = { PremadeMap };
