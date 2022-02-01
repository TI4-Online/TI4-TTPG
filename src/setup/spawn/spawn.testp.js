const { Gather } = require("./gather");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { ReplaceObjects } = require("./replace-objects");
const { Spawn } = require("./spawn");
const {
    Card,
    Rotator,
    Vector,
    refObject,
    world,
} = require("../../wrapper/api");

const ACTION = {
    CLEAN_ALL: "*Clean ALL",
    SPAWN_TYPES: "*Spawn TYPES",
    REMOVE_REPLACED: "*Remove replaced",
    GATHER_ON_TABLE: "*Gather on-table",
    GATHER_PER_PLAYER: "*Gather per-player",
    GATHER_PER_FACTION: "*Gather per-faction",
};

for (const action of Object.values(ACTION)) {
    refObject.addCustomAction(action);
}

function asyncSpawnTypes() {
    let nsids = Spawn.getAllNSIDs();
    nsids = nsids.filter(
        (nsid) => !ObjectNamespace.parseNsid(nsid).source.includes("homebrew")
    );
    const typeToNsids = Spawn.groupNSIDs(nsids);

    const x0 = 30;
    const y0 = -100;
    const z0 = world.getTableHeight() + 2;
    const yMax = 100;
    const dx = -15;
    const dy = 15;
    const pos = new Vector(x0, y0, z0);
    const rot = new Rotator(0, 0, 0);

    const nsidGroups = Object.values(typeToNsids);
    const processNext = () => {
        if (nsidGroups.length == 0) {
            console.log(`#objects = ${world.getAllObjects().length}`);
            return;
        }
        const nsids = nsidGroups.pop();

        pos.z = z0;
        let lastObj = false;
        for (const nsid of nsids) {
            const obj = Spawn.spawn(nsid, pos, rot);

            // Try to name object.
            const name = Spawn.suggestName(nsid);
            if (name) {
                obj.setName(name);
            } else {
                console.warn(`anonymous ${nsid}`);
            }

            pos.z += obj.getExtent().z * 2 + 10;

            if (obj instanceof Card && lastObj instanceof Card) {
                lastObj.addCards(obj);
            } else {
                lastObj = obj;
            }
        }

        pos.y += dy;
        if (pos.y > yMax) {
            pos.y = y0;
            pos.x += dx;
        }
        setTimeout(processNext, 100);
    };
    processNext();
}

refObject.onCustomAction.add((obj, player, actionName) => {
    console.log(`${player.getName()} selected ${actionName}`);

    if (actionName === ACTION.CLEAN_ALL) {
        for (const obj of world.getAllObjects()) {
            if (obj != refObject) {
                obj.destroy();
            }
        }
    } else if (actionName === ACTION.SPAWN_TYPES) {
        asyncSpawnTypes(player);
    } else if (actionName === ACTION.REMOVE_REPLACED) {
        const chestTemplateId = "C134C94B496A8D48C79534A5BDBC8A3D";
        const pos = new Vector(-32, 0, world.getTableHeight() + 3);
        const bag = world.createObjectFromTemplate(chestTemplateId, pos);
        bag.setName(actionName);
        const objs = ReplaceObjects.getReplacedObjects();
        bag.addObjects(objs);
    } else if (actionName === ACTION.GATHER_ON_TABLE) {
        const chestTemplateId = "C134C94B496A8D48C79534A5BDBC8A3D";
        const pos = new Vector(-32, 20, world.getTableHeight() + 3);
        const bag = world.createObjectFromTemplate(chestTemplateId, pos);
        bag.setName(actionName);
    } else if (actionName === ACTION.GATHER_PER_PLAYER) {
        const chestTemplateId = "C134C94B496A8D48C79534A5BDBC8A3D";
        const pos = new Vector(-32, 20, world.getTableHeight() + 3);
        const bag = world.createObjectFromTemplate(chestTemplateId, pos);
        bag.setName(actionName);

        bag.addObjects([Gather.gatherGenericTechDeck()]);
        bag.addObjects(Gather.gatherUnitsAndUnitBags());
        bag.addObjects(Gather.gatherCoreTokenAndTokenBags());
        bag.addObjects(Gather.gatherSheets());
    } else if (actionName === ACTION.GATHER_PER_FACTION) {
        const chestTemplateId = "C134C94B496A8D48C79534A5BDBC8A3D";
        const pos = new Vector(-32, 40, world.getTableHeight() + 3);
        const bag = world.createObjectFromTemplate(chestTemplateId, pos);
        bag.setName(actionName);
    }
});
