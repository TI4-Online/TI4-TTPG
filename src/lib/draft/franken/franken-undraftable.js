const assert = require("../../../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../../object-namespace");
const { Spawn } = require("../../../setup/spawn/spawn");
const { UNDRAFTABLE } = require("./franken.data");
const {
    Card,
    Container,
    GameObject,
    Rotator,
    Vector,
    world,
} = require("../../../wrapper/api");

function _abilityNameToNsidName(name) {
    return name
        .toLowerCase()
        .replace(/ +/g, "_")
        .replace(/[^\w\s_]/g, "");
}

class FrankenUndraftable {
    /**
     * Get NSIDs for undraftable items.  These will be added (if appropriate)
     * after choosing components.
     */
    static getUndraftableNSIDs() {
        const undraftableNSIDs = new Set();
        for (const undraftable of UNDRAFTABLE) {
            undraftableNSIDs.add(undraftable.nsid);
        }
        return undraftableNSIDs;
    }

    /**
     * Find undraftable item triggers in player areas, spawn items.
     */
    static spawnUndraftableItems(undraftableContainer) {
        assert(undraftableContainer instanceof Container);

        // Build map from trigger to undraftable entry.
        const abilityToEntries = {};
        const nsidToEntries = {};
        for (const undraftable of UNDRAFTABLE) {
            if (undraftable.triggerAbility) {
                const key = _abilityNameToNsidName(undraftable.triggerAbility);
                let entries = abilityToEntries[key];
                if (!entries) {
                    entries = [];
                    abilityToEntries[key] = entries;
                }
                entries.push(undraftable);
            }
            if (undraftable.triggerNsid) {
                let entries = nsidToEntries[undraftable.triggerNsid];
                if (!entries) {
                    entries = [];
                    nsidToEntries[undraftable.triggerNsid] = entries;
                }
                entries.push(undraftable);
            }
            if (undraftable.triggerNsids) {
                for (const nsid of undraftable.triggerNsids) {
                    let entries = nsidToEntries[nsid];
                    if (!entries) {
                        entries = [];
                        nsidToEntries[nsid] = entries;
                    }
                    entries.push(undraftable);
                }
            }
        }

        // Look for triggers, build map from undraftable item nsid to { desk, count }.
        const undraftableNsidToDestination = {};
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            const json =
                nsid === "tile:homebrew/name_desc"
                    ? JSON.parse(obj.getSavedData())
                    : undefined;

            const addUndraftable = (triggerObj, undraftable) => {
                assert(triggerObj instanceof GameObject);
                const pos = triggerObj.getPosition();
                const desk = world.TI4.getClosestPlayerDesk(pos);
                const undraftableNSID = undraftable.nsid;
                undraftableNsidToDestination[undraftableNSID] = {
                    desk,
                    count: undraftable.count,
                };
            };

            const undraftables = nsidToEntries[nsid];
            if (undraftables) {
                for (const undraftable of undraftables) {
                    addUndraftable(obj, undraftable);
                }
            }

            // Look into the object for faction abilities.
            if (json && json.abilities) {
                for (const ability of json.abilities) {
                    const undraftables = abilityToEntries[ability];
                    if (undraftables) {
                        for (const undraftable of undraftables) {
                            addUndraftable(obj, undraftable);
                        }
                    }
                }
            }
        }

        const deskIndexToNextPos = [];
        const nextPos = (desk) => {
            let thisPos = deskIndexToNextPos[desk.index];
            if (!thisPos) {
                thisPos = new Vector(0, -20, 10);
            }
            const nextPos = thisPos.add([0, 3, 0]);
            deskIndexToNextPos[desk.index] = nextPos;
            return desk.localPositionToWorld(thisPos);
        };

        // Add undraftables from container.
        for (const obj of undraftableContainer.getItems()) {
            const nsid = ObjectNamespace.getNsid(obj);
            const dst = undraftableNsidToDestination[nsid];
            if (!dst || dst.count <= 0) {
                continue;
            }
            dst.count -= 1;

            // Should this have a better position?
            const pos = nextPos(dst.desk);
            const rot =
                obj instanceof Card
                    ? new Rotator(0, dst.desk.rot.yaw, 180)
                    : dst.desk.rot;
            const success = undraftableContainer.take(obj, pos);
            assert(success);
            obj.setRotation(rot);
            obj.snapToGround();
        }

        // Spawn any remaining undraftables.
        for (const [nsid, dst] of Object.entries(
            undraftableNsidToDestination
        )) {
            for (let i = 0; i < dst.count; i++) {
                const pos = nextPos(dst.desk);
                const rot = dst.desk.rot;
                const obj = Spawn.spawn(nsid, pos, rot);
                assert(obj);
                obj.snapToGround();
            }
            dst.count = 0;
        }
    }
}

module.exports = { FrankenUndraftable };
