const assert = require("../../../wrapper/assert-wrapper");
const { world } = require("../../../wrapper/api");
const { ObjectNamespace } = require("../../object-namespace");

class FrankenFinalize {
    static readyToFinalize(errors) {
        assert(Array.isArray(errors));
        return true;
    }

    static setTurnOrder() {
        const playerSlotToTurnOrder = {};
        const destroyObjs = [];
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid !== "tile:homebrew/name_desc") {
                continue;
            }
            const json = JSON.parse(obj.getSavedData());
            if (json.turnOrder === undefined) {
                continue;
            }
            assert(typeof json.turnOrder === "number");
            const pos = obj.getPosition();
            const desk = world.TI4.getClosestPlayerDesk(pos);
            const playerSlot = desk.playerSlot;
            playerSlotToTurnOrder[playerSlot] = json.turnOrder;
            destroyObjs.push[obj];
        }
        for (const obj of destroyObjs) {
            obj.setTags(["DELETED_ITEMS_IGNORE"]);
            obj.destroy();
        }

        const order = [...world.TI4.getAllPlayerDesks()];
        order.sort((a, b) => {
            a = a.playerSlot;
            b = b.playerSlot;
            a = playerSlotToTurnOrder[a];
            b = playerSlotToTurnOrder[b];
            if (a === undefined) {
                a = Number.MAX_SAFE_INTEGER;
            }
            if (b === undefined) {
                b = Number.MAX_SAFE_INTEGER;
            }
            return a - b;
        });

        if (!world.__isMock) {
            console.log(
                `FrankenFinalize.setTurnOrder: ${order
                    .map((x) => x.index)
                    .join(", ")}`
            );
        }

        world.TI4.turns.setTurnOrder(order);
    }
}

module.exports = { FrankenFinalize };
