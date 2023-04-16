const assert = require("../../../wrapper/assert-wrapper");
const { Hex } = require("../../hex");
const MapStringHex = require("../../map-string/map-string-hex");
const { MapStringLoad } = require("../../map-string/map-string-load");
const MapStringParser = require("../../map-string/map-string-parser");
const { world } = require("../../../wrapper/api");
const { ObjectNamespace } = require("../../object-namespace");
const { Hyperlane } = require("../../map-string/hyperlane");
const {
    SetupGenericHomeSystems,
} = require("../../../setup/setup-generic-home-systems");

const MILTY_EQ_HEXES = [
    "<0,0,0>", // home
    "<1,-1,0>", // left
    "<1,0,-1>", // front
    "<0,1,-1>", // right
    "<2,0,-2>", // far-front
];

const LEFT_EQ_HEX = "<2,-1,-1>";

class MiltyEqSliceLayout {
    static _getAnchorPosition(deskIndex, _deprecated_) {
        assert(typeof deskIndex === "number");
        assert(_deprecated_ === undefined);

        const playerDesk = world.TI4.getAllPlayerDesks()[deskIndex];
        assert(playerDesk);

        return SetupGenericHomeSystems.getHomeSystemPosition(playerDesk);
    }

    static _getTilePositions(anchorPos, yaw) {
        assert(typeof anchorPos.x === "number");
        assert(yaw === undefined || typeof yaw === "number");

        if (yaw === undefined) {
            yaw = anchorPos.findLookAtRotation([0, 0, anchorPos.z]).yaw;
        }

        let hexes = MILTY_EQ_HEXES;
        return hexes.map((hex) => {
            return Hex.toPosition(hex)
                .rotateAngleAxis(yaw, [0, 0, 1])
                .add(anchorPos);
        });
    }

    static _getEqPosition(anchorPos, yaw) {
        assert(typeof anchorPos.x === "number");
        assert(yaw === undefined || typeof yaw === "number");

        if (yaw === undefined) {
            yaw = anchorPos.findLookAtRotation([0, 0, anchorPos.z]).yaw;
        }

        return Hex.toPosition(LEFT_EQ_HEX)
            .rotateAngleAxis(yaw, [0, 0, 1])
            .add(anchorPos);
    }

    static _getEqPositions() {
        const positions = [];
        for (
            let deskIndex = 0;
            deskIndex < world.TI4.config.playerCount;
            deskIndex++
        ) {
            const anchorPos = MiltyEqSliceLayout._getAnchorPosition(deskIndex);
            const pos = MiltyEqSliceLayout._getEqPosition(anchorPos);
            positions.push(pos);
        }
        return positions;
    }

    static _toMapString(slice, deskIndex, mapString) {
        assert(Array.isArray(slice));
        assert(slice.length === 4);
        assert(typeof deskIndex === "number");
        assert(!mapString || typeof mapString === "string");

        // Get tile positions.
        const anchorPos = MiltyEqSliceLayout._getAnchorPosition(deskIndex);
        const tilePosArray = MiltyEqSliceLayout._getTilePositions(
            anchorPos,
            undefined
        );

        // Convert to map string index values.
        const idxArray = tilePosArray.map((pos) => {
            const hex = Hex.fromPosition(pos);
            return MapStringHex.hexStringToIdx(hex);
        });
        assert(idxArray.length === 5);

        const mapStringArray = mapString
            ? MapStringParser.parse(mapString)
            : [];

        // Home.
        const homeIdx = idxArray.shift();
        mapStringArray[homeIdx] = { tile: 0 };

        // After shifting out home, expect 4.
        assert(idxArray.length === 4);

        // Generate slice as a map string.
        for (let i = 0; i < idxArray.length; i++) {
            const idx = idxArray[i];
            const tile = slice[i];
            mapStringArray[idx] = { tile };
        }

        // Fill in any missing slots.
        for (let i = 0; i < mapStringArray.length; i++) {
            if (mapStringArray[i] === undefined) {
                mapStringArray[i] = { tile: -1 };
            }
        }
        mapStringArray[0] = { tile: -1 };

        return MapStringParser.format(mapStringArray);
    }

    static _addEqs(eqs, mapString) {
        assert(!mapString || typeof mapString === "string");

        const mapStringArray = mapString
            ? MapStringParser.parse(mapString)
            : [];

        MiltyEqSliceLayout._getEqPositions().map((pos, deskIndex) => {
            const hex = Hex.fromPosition(pos);
            const mapStringIndex = MapStringHex.hexStringToIdx(hex);
            mapStringArray[mapStringIndex] = { tile: eqs[deskIndex] };
        });

        // Fill in any missing slots.
        for (let i = 0; i < mapStringArray.length; i++) {
            if (mapStringArray[i] === undefined) {
                mapStringArray[i] = { tile: -1 };
            }
        }
        mapStringArray[0] = { tile: -1 };

        return MapStringParser.format(mapStringArray);
    }

    static _addHyperlanes(mapString, _deprecated_) {
        assert(typeof mapString === "string");
        assert(_deprecated_ === undefined);

        const playerCount = world.TI4.config.playerCount;
        if (playerCount >= 6) {
            console.log("MiltyEqSliceLayout._addHyperlanes: >= 6 players");
            return mapString; // do not try to massage for more than 6 (not standard shape)
        }
        const hyperlanesString = Hyperlane.getMapString(playerCount);
        if (!hyperlanesString) {
            console.log("MiltyEqSliceLayout._addHyperlanes: no hyperlanes");
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

    static getMapString(slices, eqs) {
        let mapStringArray = [];
        for (
            let deskIndex = 0;
            deskIndex < world.TI4.config.playerCount;
            deskIndex++
        ) {
            const pos = MiltyEqSliceLayout._getAnchorPosition(deskIndex);
            const hex = Hex.fromPosition(pos);
            const mapStringIndex = MapStringHex.hexStringToIdx(hex);
            mapStringArray[mapStringIndex] = { tile: 0 };
        }
        for (let i = 0; i < mapStringArray.length; i++) {
            if (mapStringArray[i] === undefined) {
                mapStringArray[i] = { tile: -1 };
            }
        }
        mapStringArray[0] = { tile: -1 };
        let mapString = MapStringParser.format(mapStringArray);

        mapString = MiltyEqSliceLayout._addEqs(eqs, mapString);
        slices.forEach((slice, index) => {
            mapString = MiltyEqSliceLayout._toMapString(
                slice,
                index,
                mapString
            );
        });
        mapString = MiltyEqSliceLayout._addHyperlanes(mapString);
        return mapString;
    }

    static doLayoutSlice(slice, deskIndex) {
        assert(Array.isArray(slice));
        assert(typeof deskIndex === "number");

        const playerDesk = world.TI4.getAllPlayerDesks()[deskIndex];
        assert(playerDesk);
        const playerSlot = playerDesk.playerSlot;

        // Move home system placeholder.
        const genericHomeSystemTiles = world.getAllObjects().filter((obj) => {
            if (obj.getContainer()) {
                return false;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid !== "tile.system:base/0") {
                return false;
            }
            if (obj.getOwningPlayerSlot() !== playerSlot) {
                return false;
            }
            return true;
        });
        if (genericHomeSystemTiles.length === 1) {
            const tile = genericHomeSystemTiles[0];
            let pos = MiltyEqSliceLayout._getAnchorPosition(deskIndex);
            pos.z = tile.getPosition().z;
            tile.setPosition(pos);
        }

        const mapString = MiltyEqSliceLayout._toMapString(slice, deskIndex);
        console.log(`MiltyEqSliceLayout.doLayout ${playerSlot}: ${mapString}`);

        MapStringLoad.load(mapString, true);
    }

    static doLayoutEqs(eqs) {
        assert(Array.isArray(eqs));
        assert(eqs.length === world.TI4.config.playerCount);

        const mapStringArray = [];
        MiltyEqSliceLayout._getEqPositions().map((pos, deskIndex) => {
            const hex = Hex.fromPosition(pos);
            const mapStringIndex = MapStringHex.hexStringToIdx(hex);
            mapStringArray[mapStringIndex] = eqs[deskIndex];
        });

        // Fill in any missing slots.
        for (let i = 0; i < mapStringArray.length; i++) {
            if (mapStringArray[i] === undefined) {
                mapStringArray[i] = -1;
            }
        }
        mapStringArray[0] = "{-1}";

        const mapString = mapStringArray.join(" ");
        MapStringLoad.load(mapString, false);
    }
}

module.exports = { MiltyEqSliceLayout, MILTY_EQ_HEXES };
