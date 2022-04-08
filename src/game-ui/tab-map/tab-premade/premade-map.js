const assert = require("../../../wrapper/assert-wrapper");
const { MapStringLoad } = require("../../../lib/map-string/map-string-load");
const { ObjectNamespace } = require("../../../lib/object-namespace");
const { PremadeMapUI } = require("./premade-map-ui");
const { world } = require("../../../wrapper/api");

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
        assert(tilesBag);

        const clearedSet = new Set();
        for (const obj of world.TI4.getAllSystemTileObjects()) {
            const system = world.TI4.getSystemBySystemTileObject(obj);
            if (system.home) {
                continue;
            }
            if (!tilesBag || clearedSet.has(system.tile)) {
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
