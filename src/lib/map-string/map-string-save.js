const { Facing } = require("../facing");
const { Hex } = require("../hex");
const MapStringHex = require("./map-string-hex");
const MapStringParser = require("./map-string-parser");
const { ObjectNamespace } = require("../object-namespace");
const { world } = require("../../wrapper/api");

/**
 * Save the map string based on current table state.
 */
class MapStringSave {
    static save() {
        // Take note of rotation and side for hyperlanes.
        // world.TI4.getAllSystemTileObjects() does not find generic HS tiles.
        const mapTiles = [];
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            if (!ObjectNamespace.isSystemTile(obj)) {
                continue;
            }
            const tile = ObjectNamespace.parseSystemTile(obj).tile;
            const system = world.TI4.getSystemByTileNumber(tile);

            // Ignore if not part of the main map.
            if (system && system.raw.offMap) {
                continue;
            }

            // Get location in the map string.
            const hex = Hex.fromPosition(obj.getPosition());
            const index = MapStringHex.hexStringToIdx(hex);

            // Assemble tile data.
            const entry = {
                tile: tile,
            };
            if (system && system.raw.hyperlane) {
                entry.rotation = obj.getRotation().yaw + 30;
                entry.rotation = (entry.rotation + 360) % 360;
                entry.rotation = Math.floor(entry.rotation / 60);
                entry.side = Facing.isFaceUp(obj) ? "A" : "B";
            }

            mapTiles[index] = entry;
        }

        // Assemble the string.
        if (mapTiles.length == 0) {
            return ""; // technically wrong b/c empty means Mecatol
        }
        return MapStringParser.format(mapTiles).trim();
    }
}

module.exports = { MapStringSave };
