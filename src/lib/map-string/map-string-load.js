const assert = require("../../wrapper/assert-wrapper");
const { Hex } = require("../hex");
const { ObjectNamespace } = require("../object-namespace");
const { Spawn } = require("../../setup/spawn/spawn");
const MapStringHex = require("./map-string-hex");
const MapStringParser = require("./map-string-parser");
const { ObjectType, Rotator, world } = require("../../wrapper/api");

/**
 * Place system tiles according to map string.
 *
 * Try to find tiles on table or in a container, spawn if missing.
 */
class MapStringLoad {
    static load(mapString) {
        assert(typeof mapString === "string");

        const parsedMapString = MapStringParser.parse(mapString);

        // Find existing tiles (may be inside containers).
        const tileToSystemObj = {};
        for (const obj of world.TI4.getAllSystemTileObjects()) {
            const tile = ObjectNamespace.parseSystemTile(obj).tile;
            tileToSystemObj[tile] = obj;
        }

        const placeTile = (entry, hex) => {
            const system = world.TI4.getSystemByTileNumber(entry.tile);
            assert(system);

            // Get position/rotation.
            const pos = Hex.toPosition(hex);
            pos.z = world.getTableHeight() + 10;
            const rot = new Rotator(0, 0, 0);
            if (entry.side == "b") {
                rot.roll = 180;
            }
            if (entry.rotation) {
                rot.yaw = entry.rotation * 60;
            }
            //console.log(`placeTile ${entry.tile} at ${pos} / ${rot}`);

            // Find or spawn the tile.
            let obj = tileToSystemObj[entry.tile];
            if (obj) {
                // Use object, remove it should the tile appear again.
                delete tileToSystemObj[entry.tile];
            } else {
                // Missing tile, spawn a new one.
                const nsid = `tile.system:${system.raw.source}/${entry.tile}`;
                obj = Spawn.spawn(nsid, pos, rot);
            }

            // Place tile.
            const animSpeed = 1;
            obj.setObjectType(ObjectType.Regular);
            if (obj.getContainer()) {
                obj.getContainer().take(obj, pos, animSpeed > 0);
                obj.setRotation(rot, animSpeed);
            } else {
                obj.setPosition(pos, animSpeed);
                obj.setRotation(rot, animSpeed);
            }
            obj.setObjectType(ObjectType.Ground);
        };

        // Place!
        for (let i = 0; i < parsedMapString.length; i++) {
            const entry = parsedMapString[i];
            if (entry.tile <= 0) {
                continue;
            }
            const hex = MapStringHex.idxToHexString(i);
            placeTile(entry, hex);
        }

        // Add Mallice
        placeTile({ tile: 82 }, "<-4,5,-1>");
    }
}

module.exports = { MapStringLoad };
