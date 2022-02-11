const { Facing } = require("../facing");
const { Hex } = require("../hex");
const MapStringHex = require("./map-string-hex");
const MapStringParser = require("./map-string-parser");
const { ObjectNamespace } = require("../object-namespace");
const { System } = require("../system/system");
const { world } = require("../../wrapper/api");

/**
 * Save the map string based on current table state.
 */
class MapStringSave {
    static save() {
        // Scan the table, find all system tiles with their map string index.
        // Take note of rotation and side for hyperlanes.
        const mapTiles = [];
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue; // ignore objects inside containers
            }
            if (!ObjectNamespace.isSystemTile(obj)) {
                continue; // not a map tile
            }

            // Get location in the map string.
            const hex = Hex.fromPosition(obj.getPosition());
            const index = MapStringHex.hexStringToIdx(hex);

            // Assemble tile data.
            const tile = ObjectNamespace.parseSystemTile(obj).tile;
            const system = System.getByTileNumber(tile);
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
