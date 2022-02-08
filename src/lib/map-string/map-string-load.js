const assert = require("../../wrapper/assert-wrapper");
const { Hex } = require("../hex");
const { ObjectNamespace } = require("../object-namespace");
const MapStringHex = require("./map-string-hex");
const MapStringParser = require("./map-string-parser");
const { ObjectType, Rotator, world } = require("../../wrapper/api");

/**
 * Place system tiles according to map string.
 */
class MapStringLoad {
    static load(mapString) {
        assert(typeof mapString === "string");

        const parsedMapString = MapStringParser.parse(mapString);

        // Find existing tiles (may be inside containers).
        const tileToSystemObj = {};
        for (const obj of world.getAllObjects()) {
            if (ObjectNamespace.isSystemTile(obj)) {
                const tile = ObjectNamespace.parseSystemTile(obj).tile;
                tileToSystemObj[tile] = obj;
            }
        }

        // Make sure we have the named tiles.
        for (const entry of parsedMapString) {
            if (!tileToSystemObj[entry.tile]) {
                throw new Error(`missing system tile ${entry.tile}`);
            }
        }

        // Place!
        for (let i = 0; i < parsedMapString.length; i++) {
            const entry = parsedMapString[i];
            const hex = MapStringHex.idxToHexString(i);
            const pos = Hex.toPosition(hex);
            pos.z = world.getTableHeight() + 10;
            const rot = new Rotator(0, 0, 0);
            if (entry.side == "b") {
                rot.roll = 180;
            }
            if (entry.rotation) {
                rot.yaw = entry.rotation * 60;
            }
            const obj = tileToSystemObj[entry.tile];
            assert(obj);
            //console.log(`placing ${entry.tile} at ${pos} / ${rot}`);
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
        }
    }
}

module.exports = { MapStringLoad };
