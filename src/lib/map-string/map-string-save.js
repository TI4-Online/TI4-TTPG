const assert = require("../../wrapper/assert-wrapper");
const { Facing } = require("../facing");
const { Hex } = require("../hex");
const MapStringHex = require("./map-string-hex");
const MapStringParser = require("./map-string-parser");
const { ObjectNamespace } = require("../object-namespace");
const { System } = require("../system/system");

/**
 * Save the map string based on current table state.
 */
class MapStringSave {
    static save() {
        // Take note of rotation and side for hyperlanes.
        const systemTileObjs = System.getAllSystemTileObjects();
        const mapTiles = [];
        for (const obj of systemTileObjs) {
            assert(ObjectNamespace.isSystemTile(obj));
            const tile = ObjectNamespace.parseSystemTile(obj).tile;
            const system = System.getByTileNumber(tile);

            // Ignore if not part of the main map.
            if (system.raw.offMap) {
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
                entry.rotation = Math.floor((obj.getRotation().yaw + 30) / 60);
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
