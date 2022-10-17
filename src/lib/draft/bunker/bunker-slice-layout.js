const assert = require("../../../wrapper/assert-wrapper");
const { Hex } = require("../../hex");
const MapStringHex = require("../../map-string/map-string-hex");
const { MapStringLoad } = require("../../map-string/map-string-load");
const MapStringParser = require("../../map-string/map-string-parser");
const { world } = require("../../../wrapper/api");
const { ObjectNamespace } = require("../../object-namespace");

const BUNKER_HEXES = [
    "<0,0,0>", // home
    "<0,-1,1>", // leftmost
    "<1,-1,0>", // left
    "<1,0,-1>", // right
    "<0,1,-1>", // rightmost
];

const HOME_HEXES = [
    "<-2,3,-1>",
    "<-3,1,2>",
    "<-1,-2,3>",
    "<2,-3,1>",
    "<3,-1,-2>",
    "<1,2,-3>",
];

class BunkerSliceLayout {
    static _getAnchorPosition(deskIndex, playerCount) {
        assert(typeof deskIndex === "number");
        assert(deskIndex >= 0 && deskIndex < 6);
        assert(typeof playerCount === "number");

        if (playerCount === 5) {
            // bottom is hyperlanes
            if (deskIndex >= 1) {
                deskIndex += 1;
            }
        } else if (playerCount === 4) {
            // bottom and top are hyperlanes.
            if (deskIndex >= 1) {
                deskIndex += 1;
            }
            if (deskIndex >= 4) {
                deskIndex += 1;
            }
        } else if (playerCount === 3) {
            // SE, SW, N are hyperlanes.
            deskIndex += 1; // SE
            if (deskIndex >= 2) {
                deskIndex += 1;
            }
            if (deskIndex >= 4) {
                deskIndex += 1;
            }
        } else if (playerCount === 2) {
            // SE, SW, NW, NE are hyperlanes.
            deskIndex += 1; // SE
            if (deskIndex >= 2) {
                deskIndex += 2;
            }
        }

        // These are non-standard home system positions.
        const hex = HOME_HEXES[deskIndex];
        return Hex.toPosition(hex);
    }

    static _getTilePositions(anchorPos, yaw) {
        assert(typeof anchorPos.x === "number");
        assert(yaw === undefined || typeof yaw === "number");

        if (yaw === undefined) {
            yaw = anchorPos.findLookAtRotation([0, 0, anchorPos.z]).yaw;
        }

        return BUNKER_HEXES.map((hex) => {
            return Hex.toPosition(hex)
                .rotateAngleAxis(yaw, [0, 0, 1])
                .add(anchorPos);
        });
    }

    static _toMapString(bunker, deskIndex, playerCount) {
        assert(Array.isArray(bunker));
        assert(bunker.length === 4);
        assert(typeof deskIndex === "number");
        assert(typeof playerCount === "number");

        // Get tile positions.
        const anchorPos = BunkerSliceLayout._getAnchorPosition(
            deskIndex,
            playerCount
        );
        const tilePosArray = BunkerSliceLayout._getTilePositions(anchorPos);

        // Convert to map string index values.
        const idxArray = tilePosArray.map((pos) => {
            const hex = Hex.fromPosition(pos);
            return MapStringHex.hexStringToIdx(hex);
        });
        assert(idxArray.length === 5);

        const mapStringArray = [];

        // Home.
        const homeIdx = idxArray.shift();
        mapStringArray[homeIdx] = 0;

        // After shifting out home, expect 4.
        assert(idxArray.length === 4);

        // Generate bunker as a map string.
        for (let i = 0; i < idxArray.length; i++) {
            const idx = idxArray[i];
            const tile = bunker[i];
            mapStringArray[idx] = tile;
        }

        // Fill in any missing slots.
        for (let i = 0; i < mapStringArray.length; i++) {
            if (mapStringArray[i] === undefined) {
                mapStringArray[i] = -1;
            }
        }
        mapStringArray[0] = "{-1}";

        return mapStringArray.join(" ");
    }

    static _addHyperlanes(mapString, playerCount) {
        assert(typeof mapString === "string");
        assert(typeof playerCount === "number");

        let merge;
        if (playerCount === 2) {
            merge =
                "{-1} -1 86A4 89B0 -1 86A1 89B3 -1 83A1 86A4 83A2 83A5 -1 -1 83A1 86A1 83A5 83A5 -1 -1 87B2 83A1 86A4 83A5 83A5 86A5 -1 -1 -1 87B5 83A1 86A1 83A2 83A5 86A2";
        } else if (playerCount === 3) {
            merge =
                "{-1} 89B4 -1 89B0 -1 89B2 -1 83A0 -1 -1 83A5 83A5 -1 -1 83A1 83A1 -1 -1 83A0 86A3 -1 -1 -1 87B3 83A5 86A5 -1 -1 -1 87B5 83A1 86A1 -1 -1 -1 87B1 83A0";
        } else if (playerCount === 4) {
            merge =
                "{-1} 89B4 -1 -1 89B1 -1 -1 83A0 -1 -1 -1 -1 83A0 83A0 -1 -1 -1 -1 83A0 86A3 -1 -1 -1 -1 -1 0 87B4 83A0 86A0 -1 -1 -1 -1 -1 -1 87B1 83A0";
        } else if (playerCount === 5) {
            merge =
                "{-1} -1 -1 -1 89B1 -1 -1 -1 -1 -1 -1 -1 83A0 83A0 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 87B4 83A0 86A0";
        } else {
            merge = "{-1}"; // unsupported player count
        }

        const mapStringArray = MapStringParser.parse(mapString);
        const hyperlaneArray = MapStringParser.parse(merge);

        hyperlaneArray.forEach((entry, index) => {
            if (entry.tile <= 0) {
                return;
            }
            const mapStringEntry = mapStringArray[index];
            assert(!mapStringEntry || mapStringEntry.tile <= 0);
            mapStringArray[index] = entry;
        });

        return MapStringParser.format(mapStringArray);
    }

    static doLayoutBunker(bunker, playerSlot) {
        assert(Array.isArray(bunker));
        assert(typeof playerSlot === "number");

        const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
        assert(playerDesk);
        const deskIndex = playerDesk.index;
        const playerCount = world.TI4.config.playerCount;

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
            const pos = BunkerSliceLayout._getAnchorPosition(
                deskIndex,
                playerCount
            );
            pos.z = tile.getPosition().z;
            tile.setPosition(pos);
        }

        const mapString = BunkerSliceLayout._toMapString(
            bunker,
            deskIndex,
            playerCount
        );
        console.log(
            `BunkerSliceLayout.doLayoutBunker ${playerSlot}: ${mapString}`
        );

        MapStringLoad.load(mapString, true);
    }

    static doLayoutInnerRing(innerRing) {
        assert(Array.isArray(innerRing));
        assert(innerRing.length === 6);

        const mapString = innerRing.join(" ");
        MapStringLoad.load(mapString, false);
    }
}

module.exports = { BunkerSliceLayout };
