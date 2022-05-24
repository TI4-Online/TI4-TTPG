const assert = require("../../../wrapper/assert-wrapper");
const { Hex } = require("../../hex");
const { Hyperlane } = require("../../map-string/hyperlane");
const MapStringHex = require("../../map-string/map-string-hex");
const { MapStringLoad } = require("../../map-string/map-string-load");
const MapStringParser = require("../../map-string/map-string-parser");
const { ObjectNamespace } = require("../../object-namespace");
const {
    SetupGenericHomeSystems,
} = require("../../../setup/setup-generic-home-systems");
const { world } = require("../../../wrapper/api");

const SLICE_HEXES = [
    "<0,0,0>", // home
    "<1,-1,0>", // left
    "<1,0,-1>", // front
    "<0,1,-1>", // right
    "<2,-1,-1>", // left-eq
    "<2,0,-2>", // far-front
];

const SLICE_HEXES_HYPERLANES_LEFT = [...SLICE_HEXES];
SLICE_HEXES_HYPERLANES_LEFT[4] = "<3,-1,-2>";

/**
 * Place system tiles on the map given a milty slice string and home system position.
 */
class MiltySliceLayout {
    static _getAnchorPosition(playerSlot) {
        assert(typeof playerSlot === "number");

        // Find generic home system anchor.
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            if (obj.getOwningPlayerSlot() !== playerSlot) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid !== "tile.system:base/0") {
                continue;
            }
            const pos = obj.getPosition();
            return pos;
        }

        // No anchor?  Use default.
        const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
        assert(playerDesk);
        return SetupGenericHomeSystems.getHomeSystemPosition(playerDesk);
    }

    static _getTilePositions(anchorPos, yaw) {
        assert(typeof anchorPos.x === "number");
        assert(typeof yaw === "number");

        return SLICE_HEXES.map((hex) => {
            return Hex.toPosition(hex)
                .rotateAngleAxis(yaw, [0, 0, 1])
                .add(anchorPos);
        });
    }

    static _toMapString(miltySliceString, playerSlot) {
        assert(typeof miltySliceString === "string");
        assert(typeof playerSlot === "number");

        const tileNumbers = Array.from(miltySliceString.matchAll(/\d+/g)).map(
            (str) => Number.parseInt(str)
        );
        assert(Array.isArray(tileNumbers));
        assert(tileNumbers.length === 5);

        // Get tile positions.
        const anchorPos = MiltySliceLayout._getAnchorPosition(playerSlot);
        const yaw = anchorPos.findLookAtRotation([0, 0, anchorPos.z]).yaw;
        const posArray = MiltySliceLayout._getTilePositions(anchorPos, yaw);

        // Convert to map string index values.
        const idxArray = posArray.map((pos) => {
            const hex = Hex.fromPosition(pos);
            return MapStringHex.hexStringToIdx(hex);
        });
        assert(idxArray.length === 6);

        const mapStringArray = [];

        // Home.
        const homeIdx = idxArray.shift();
        mapStringArray[homeIdx] = 0;

        // After shifting out home, expect 5.
        assert(idxArray.length === 5);

        // Generate slice as a map string (not slice string)
        for (let i = 0; i < idxArray.length; i++) {
            const idx = idxArray[i];
            const tile = tileNumbers[i];
            mapStringArray[idx] = tile;
        }

        // Fill in any missing slots.
        for (let i = 0; i < mapStringArray.length; i++) {
            if (mapStringArray[i] === undefined) {
                mapStringArray[i] = -1;
            }
        }
        mapStringArray[0] = "{-1}";

        // Shift for hyperlanes.

        return mapStringArray.join(" ");
    }

    static _addHyperlanes(mapString) {
        assert(typeof mapString === "string");

        const playerCount = world.TI4.config.playerCount;
        assert(typeof playerCount === "number");
        if (playerCount >= 6) {
            console.log("MiltySliceLayout._addHyperlanes: >= 6 players");
            return mapString; // do not try to massage for more than 6 (not standard shape)
        }
        const hyperlanesString = Hyperlane.getMapString(playerCount);
        if (!hyperlanesString) {
            console.log("MiltySliceLayout._addHyperlanes: no hyperlanes");
            return mapString;
        }

        const mapStringArray = MapStringParser.parse(mapString);
        const hyperlaneArray = MapStringParser.parse(hyperlanesString);

        const open = [];
        const move = [];
        hyperlaneArray.forEach((entry, index) => {
            const mapStringEntry = mapStringArray[index];
            // Add hyperlane to map string.  If there is a tile there mark for move.
            if (index > 0 && entry.tile > 0) {
                if (mapStringEntry && mapStringEntry.tile > 0) {
                    move.push({ index, entry: mapStringEntry });
                }
                mapStringArray[index] = entry;
            }
            // Keep track of open slots in the second ring.
            if (
                index >= 7 &&
                index <= 18 &&
                entry.tile <= 0 &&
                (!mapStringEntry || mapStringEntry.tile <= 0)
            ) {
                open.push(index);
            }
        });

        // Rather than hard-coding shifts, move to next slot in center ring.
        for (const moveItem of move) {
            let nextIndex = moveItem.index + 1;
            if (nextIndex === 19) {
                nextIndex = 7;
            }
            if (!open.includes(nextIndex)) {
                console.log(
                    "MiltySliceLayout._addHyperlanes: expected open failed, aborting"
                );
                return mapString;
            }
            mapStringArray[nextIndex] = moveItem.entry;
        }

        return MapStringParser.format(mapStringArray);
    }

    static doLayout(miltySliceString, playerSlot) {
        assert(typeof miltySliceString === "string");
        assert(typeof playerSlot === "number");

        let mapString = MiltySliceLayout._toMapString(
            miltySliceString,
            playerSlot
        );
        console.log(`${playerSlot}: ${mapString}`);

        MapStringLoad.load(mapString, true);
    }
}

module.exports = { MiltySliceLayout, SLICE_HEXES };
