const assert = require("../../wrapper/assert-wrapper");
const { Hex } = require("../../lib/hex");
const { ObjectNamespace } = require("../../lib/object-namespace");
const PositionToPlanet = require("../../lib/system/position-to-planet");
const { Spawn } = require("../../setup/spawn/spawn");
const { TableLayout } = require("../../table/table-layout");
const { ObjectType, Rotator, Vector, world } = require("../../wrapper/api");

const LOCAL_POS = new Vector(2.0, 9.5, 0); // (2.2, 31, 0) if turn order is on left
const LOCAL_ROT = new Rotator(0, 0, 0);
const ARENA_TILE_WIDTH = 34.5;
const ARENA_TILE_HEIGHT = 26.5;

class AutoRollerArena {
    static debugVisualize() {
        const anchor = TableLayout.anchor.gameUI;
        const pos = TableLayout.anchorPositionToWorld(anchor, LOCAL_POS);
        const rot = TableLayout.anchorRotationToWorld(anchor, LOCAL_ROT);
        const extent = [ARENA_TILE_HEIGHT / 2, ARENA_TILE_WIDTH / 2, 0.1];
        const color = [1, 0, 0, 1];
        const duration = 20; // seconds
        const thickness = 0.2;
        world.drawDebugBox(pos, extent, rot, color, duration, thickness);
    }

    /**
     * Convert the world position to a "relative to the center of a hex" position.
     *
     * @param {Vector} pos
     * @returns {Vector}
     */
    static _worldPositionToHexLocal(pos) {
        assert(typeof pos.x === "number");

        const anchor = TableLayout.anchor.gameUI;
        const center = TableLayout.anchorPositionToWorld(anchor, LOCAL_POS);
        const rot = TableLayout.anchorRotationToWorld(anchor, LOCAL_ROT);
        const scale = Hex.HALF_SIZE / ARENA_TILE_HEIGHT;
        const result = pos
            .subtract(center)
            .rotateAngleAxis(-rot.yaw, [0, 0, 1])
            .multiply(scale);
        return result;
    }

    static _hexLocalPositionToWorld(pos) {
        assert(typeof pos.x === "number");

        const anchor = TableLayout.anchor.gameUI;
        const center = TableLayout.anchorPositionToWorld(anchor, LOCAL_POS);
        const rot = TableLayout.anchorRotationToWorld(anchor, LOCAL_ROT);
        const scale = ARENA_TILE_HEIGHT / Hex.HALF_SIZE;
        const result = pos
            .multiply(scale)
            .rotateAngleAxis(rot.yaw, [0, 0, 1])
            .add(center);
        return result;
    }

    static _filterToUnitPlasticsInsideArena(unitPlastics) {
        const activeSystemObj = world.TI4.getActiveSystemTileObject();
        if (!activeSystemObj) {
            return [];
        }
        const activeHex = Hex.fromPosition(activeSystemObj.getPosition());

        const anchor = TableLayout.anchor.gameUI;
        const center = TableLayout.anchorPositionToWorld(anchor, LOCAL_POS);
        const maxD = ((ARENA_TILE_WIDTH * 1.1) / 2) ** 2;
        return unitPlastics.filter((unitPlastic) => {
            // Fast filter units close to arena.
            const pos = unitPlastic.gameObject.getPosition();
            const d = pos.subtract(center).magnitudeSquared();
            if (d > maxD) {
                return false;
            }

            // Slower but exact filter to hex.
            const hexLocal = AutoRollerArena._worldPositionToHexLocal(pos);
            const dst = activeSystemObj.localPositionToWorld(hexLocal);
            const hex = Hex.fromPosition(dst);
            if (hex !== activeHex) {
                return false;
            }

            unitPlastic.__insideArena = true;
            return true;
        });
    }

    static rewriteArenaUnitHexes(unitPlastics) {
        assert(Array.isArray(unitPlastics));

        const activeSystemObj = world.TI4.getActiveSystemTileObject();
        if (!activeSystemObj) {
            return [];
        }
        const activeHex = Hex.fromPosition(activeSystemObj.getPosition());

        unitPlastics =
            AutoRollerArena._filterToUnitPlasticsInsideArena(unitPlastics);
        for (const unitPlastic of unitPlastics) {
            unitPlastic._hex = activeHex;
        }
    }

    static rewriteArenaUnitPlanets(unitPlastics) {
        assert(Array.isArray(unitPlastics));

        const activeSystemObj = world.TI4.getActiveSystemTileObject();
        if (!activeSystemObj) {
            return [];
        }

        unitPlastics =
            AutoRollerArena._filterToUnitPlasticsInsideArena(unitPlastics);
        for (const unitPlastic of unitPlastics) {
            const pos = unitPlastic.gameObject.getPosition();
            const hexLocal = AutoRollerArena._worldPositionToHexLocal(pos);
            const dst = activeSystemObj.localPositionToWorld(hexLocal);
            unitPlastic._planet = PositionToPlanet.getClosestPlanet(
                dst,
                activeSystemObj
            );
            unitPlastic._exactPlanet = PositionToPlanet.getExactPlanet(
                dst,
                activeSystemObj
            );
        }
    }

    static warpIn() {
        console.log("AutoRollerArena.warpIn");

        const activeSystemObj = world.TI4.getActiveSystemTileObject();
        if (!activeSystemObj) {
            console.log("AutoRollerArena.warpIn: no active system, aborting");
        }

        const hex = Hex.fromPosition(activeSystemObj.getPosition());
        const unitPlastics = world.TI4.getAllUnitPlastics().filter(
            (unitPlastic) => {
                return unitPlastic.hex === hex && !unitPlastic.__insideArena;
            }
        );

        // Sort by height to preserve stacks.
        unitPlastics.sort((a, b) => {
            return a.gameObject.getPosition().z - b.gameObject.getPosition().z;
        });

        for (const unitPlastic of unitPlastics) {
            const src = unitPlastic.gameObject.getPosition();
            const hexLocal = activeSystemObj.worldPositionToLocal(src);
            const dst = AutoRollerArena._hexLocalPositionToWorld(hexLocal);
            dst.z = src.z + 15; // move above then snap down (may be other units there)
            const objectType = unitPlastic.gameObject.getObjectType();
            unitPlastic.gameObject.setObjectType(ObjectType.Regular);
            unitPlastic.gameObject.setPosition(dst, 1);
            unitPlastic.gameObject.snapToGround();
            unitPlastic.gameObject.setObjectType(objectType);
        }
    }

    static warpOut() {
        console.log("AutoRollerArena.warpOut");

        const activeSystemObj = world.TI4.getActiveSystemTileObject();
        if (!activeSystemObj) {
            console.log("AutoRollerArena.warpIn: no active system, aborting");
        }

        let unitPlastics = world.TI4.getAllUnitPlastics();
        unitPlastics =
            AutoRollerArena._filterToUnitPlasticsInsideArena(unitPlastics);

        // Sort by height to preserve stacks.
        unitPlastics.sort((a, b) => {
            return a.gameObject.getPosition().z - b.gameObject.getPosition().z;
        });

        for (const unitPlastic of unitPlastics) {
            const src = unitPlastic.gameObject.getPosition();
            const hexLocal = AutoRollerArena._worldPositionToHexLocal(src);
            const dst = activeSystemObj.localPositionToWorld(hexLocal);
            dst.z = src.z + 15; // move above then snap down (may be other units there)
            const objectType = unitPlastic.gameObject.getObjectType();
            unitPlastic.gameObject.setObjectType(ObjectType.Regular);
            unitPlastic.gameObject.setPosition(dst, 1);
            unitPlastic.gameObject.snapToGround();
            unitPlastic.gameObject.setObjectType(objectType);
        }
    }

    static createArenaPlatform() {
        console.log("AutoRollerArena.createArenaPlatform");

        const platformNsid = "tool:base/arena_platform";
        const anchor = TableLayout.anchor.gameUI;
        const pos = TableLayout.anchorPositionToWorld(anchor, LOCAL_POS);
        const rot = TableLayout.anchorRotationToWorld(anchor, LOCAL_ROT);
        const obj = Spawn.spawn(platformNsid, pos, rot);
        obj.setTags(["DELETED_ITEMS_IGNORE"]);
        obj.freeze();

        // What happens if there are objects in the space?
        // Looks like they just lift on top without any physics excitment.

        // Do not let anyone unlock or move it!
        obj.onTick.add(() => {
            const objectType = obj.getObjectType();
            if (objectType != ObjectType.Ground) {
                console.log("AutoRollerArenda: re-freezing platform");
                obj.setPosition(pos);
                obj.setRotation(rot);
                obj.freeze();
            }
        });
    }

    static destroyArenaPlatform() {
        console.log("AutoRollerArena.destroyArenaPlatform");

        const platformNsid = "tool:base/arena_platform";
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid !== platformNsid) {
                continue;
            }
            obj.setTags(["DELETED_ITEMS_IGNORE"]);
            obj.destroy();
        }
    }
}

// Make sure there are no lingering platforms.
if (!world.__isMock) {
    process.nextTick(() => {
        AutoRollerArena.destroyArenaPlatform();
    });
}

module.exports = { AutoRollerArena };
