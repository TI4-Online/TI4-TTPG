const assert = require("../../wrapper/assert-wrapper");
const locale = require("../locale");
const { Broadcast } = require("../broadcast");
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
    static load(mapString, skipMallice = false) {
        assert(typeof mapString === "string");

        const parsedMapString = MapStringParser.parse(mapString);
        if (!parsedMapString) {
            return false;
        }

        // Verify systems exist.
        const unknown = [];
        for (let i = 0; i < parsedMapString.length; i++) {
            const entry = parsedMapString[i];
            if (entry.tile <= 0) {
                continue;
            }
            const system = world.TI4.getSystemByTileNumber(entry.tile);
            if (system) {
                continue;
            }
            unknown.push(entry.tile);
        }
        if (unknown.length > 0) {
            const msg = locale("ui.error.missing_tile", {
                tileCount: unknown.length,
                tileStr: unknown.join(", "),
            });
            Broadcast.chatAll(msg, Broadcast.ERROR);
            console.log(msg);
            return false;
        }

        // Find existing tiles (may be inside containers).
        const tileToSystemObj = {};
        const skipContained = false; // look inside containers!
        for (const obj of world.getAllObjects(skipContained)) {
            if (ObjectNamespace.isSystemTile(obj)) {
                const tile = ObjectNamespace.parseSystemTile(obj).tile;
                tileToSystemObj[tile] = obj;
            }
        }

        const placeTile = (entry, hex) => {
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

            // Special handling for 0r, 0g, 0b.
            if (entry.tile === 0 && entry.side) {
                if (entry.side === "r") {
                    entry.tile = 48;
                    rot.roll = 180;
                } else if (entry.side === "g") {
                    entry.tile = 1;
                    rot.roll = 180;
                } else if (entry.side === "b") {
                    entry.tile = 61;
                    rot.roll = 180;
                }
            }

            // Find or spawn the tile.
            const system = world.TI4.getSystemByTileNumber(entry.tile);
            assert(system);
            let obj = tileToSystemObj[entry.tile];
            if (obj) {
                // Use object, remove it should the tile appear again.
                delete tileToSystemObj[entry.tile];
            } else {
                // Missing tile, spawn a new one.
                const nsid = `tile.system:${system.raw.source}/${entry.tile}`;
                obj = Spawn.spawn(nsid, pos, rot);
            }

            // Mallice starts upside down.
            if (entry.tile === 82) {
                rot.roll = 180;
            }

            // Place tile.
            obj.setObjectType(ObjectType.Regular);
            const container = obj.getContainer();
            if (container) {
                // Remove from container before moving to final location.
                // Bug report said it fell through the table after take.
                const above = container.getPosition().add([0, 0, 10]);
                container.take(obj, above, false);
            }
            obj.setPosition(pos, 0);
            obj.setRotation(rot, 0);
            obj.snapToGround();
            obj.setObjectType(ObjectType.Ground);
        };

        // Place!
        for (let i = 0; i < parsedMapString.length; i++) {
            const entry = parsedMapString[i];
            if (entry.tile <= 0 && !entry.side) {
                continue;
            }
            const hex = MapStringHex.idxToHexString(i);
            placeTile(entry, hex);
        }

        // Add Mallice
        if (world.TI4.config.pok && !skipMallice) {
            // lower right: "<-4,5,-1>"
            // lower left: "<1,-5,4>"
            placeTile({ tile: 82 }, "<1,-5,4>");
        }
        return true;
    }

    static moveGenericHomeSystemTiles(mapString) {
        assert(typeof mapString === "string");

        const playerCount = world.TI4.config.playerCount;
        const parsedMapString = MapStringParser.parse(mapString);
        if (!parsedMapString) {
            return false;
        }

        // Get available positions from map string.
        const zeroHexes = [];
        for (let i = 0; i < parsedMapString.length; i++) {
            const entry = parsedMapString[i];
            if (entry && entry.tile === 0) {
                const hex = MapStringHex.idxToHexString(i);
                zeroHexes.push(hex);
            }
        }
        if (zeroHexes.length !== playerCount) {
            console.log(
                `moveGenericHomeSystemTiles: count mismatch (string has ${zeroHexes.length}, player count ${playerCount})`
            );
            return false; // abort if wrong number
        }

        // Sort zero hexes to be in angle order, which might not match map string order.
        zeroHexes.sort((a, b) => {
            const aPos = Hex.toPosition(a);
            const bPos = Hex.toPosition(b);
            const aAngle = Math.atan2(aPos.y, aPos.x);
            const bAngle = Math.atan2(bPos.y, bPos.x);
            return aAngle - bAngle;
        });

        // Get generic home system tiles.
        const playerSlotToGeneric = {};
        const skipContained = true;
        for (const obj of world.getAllObjects(skipContained)) {
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid !== "tile.system:base/0") {
                continue;
            }
            const playerSlot = obj.getOwningPlayerSlot();
            if (world.TI4.getPlayerDeskByPlayerSlot(playerSlot)) {
                playerSlotToGeneric[playerSlot] = obj;
            }
        }
        if (Object.keys(playerSlotToGeneric).length !== playerCount) {
            console.log(
                `moveGenericHomeSystemTiles: count mismatch (${zeroHexes.length} generic tiles, player count ${playerCount})`
            );
            return false; // abort if wrong number
        }

        // Move tiles to available positions.
        // Optimal placement is called "the assignment problem" and is tricky.
        // Make a simplifying assumption that tiles in clockwise order get the
        // player zone colors in clockwise order, choosing the best start.
        const deskIndexToPos = {};
        const playerDeskArray = world.TI4.getAllPlayerDesks();
        playerDeskArray.forEach((playerDesk, index) => {
            const pos = playerDesk.center.clone();
            pos.z = 0;
            deskIndexToPos[index] = pos;
        });

        const hexIndexToPos = {};
        zeroHexes.forEach((hex, index) => {
            const pos = Hex.toPosition(hex).clone();
            pos.z = 0;
            hexIndexToPos[index] = pos;
        });

        let best = false;
        let bestD = Number.MAX_VALUE;
        for (let candidate = 0; candidate < playerCount; candidate++) {
            let d = 0;
            for (let offset = 0; offset < playerCount; offset++) {
                const index = (offset + candidate) % playerCount;
                const deskPos = deskIndexToPos[offset];
                const hexPos = hexIndexToPos[index];
                d += deskPos.subtract(hexPos).magnitudeSquared();
            }
            if (d < bestD) {
                best = candidate;
                bestD = d;
            }
        }

        playerDeskArray.forEach((playerDesk, index) => {
            index = (index + best) % playerCount;
            const playerSlot = playerDesk.playerSlot;
            const genericHomeSystem = playerSlotToGeneric[playerSlot];
            const hex = zeroHexes[index];
            const pos = Hex.toPosition(hex);
            pos.z = world.getTableHeight() + 1;
            if (genericHomeSystem) {
                genericHomeSystem.setPosition(pos);
            }
        });
        return true;
    }
}

module.exports = { MapStringLoad };
