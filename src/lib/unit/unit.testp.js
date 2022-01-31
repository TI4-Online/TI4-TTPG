// Add to a TTPG object to run tests in the game world.
const { UnitBags } = require("../../setup/unit-bags");
const { UnitAttrs } = require("./unit-attrs");
const { UnitModifier } = require("./unit-modifier");
const { Vector, Rotator, refObject, world } = require("../../wrapper/api");

const ACTION = {
    SETUP_LINEAR: "*Setup linear",
    SETUP_ARC: "*Setup arc",
    CLEAN: "*Clean",
    COUNT: "*Count Objects",
    SPAWN_UNTIL_FAIL: "*Spawn until fail",
    UNIT_ATTRS: "*Unit Attributes",
    UNIT_MODIFIERS: "*Unit Modifiers",
};

for (const action of Object.values(ACTION)) {
    refObject.addCustomAction(action);
}

refObject.onCustomAction.add((obj, player, actionName) => {
    console.log(`${player.getName()} selected ${actionName}`);

    if (actionName === ACTION.SETUP_LINEAR) {
        const unitBags = new UnitBags();
        const centerPosition = new Vector(-10, 0, world.getTableHeight());
        const forwardRotation = new Rotator(0, 0, 0);
        const distanceBetweenBags = 6;
        unitBags.layoutLinear(
            centerPosition,
            forwardRotation,
            distanceBetweenBags
        );
        const playerSlot = 5; // pink
        unitBags.setup(playerSlot);
    }

    if (actionName === ACTION.SETUP_ARC) {
        const unitBags = new UnitBags();
        const centerPosition = new Vector(0, 0, world.getTableHeight());
        const distanceBetweenBags = 6;
        unitBags.layoutArc(
            centerPosition,
            new Vector(30, 0, 0),
            distanceBetweenBags
        );
        const playerSlot = 14; // teal
        unitBags.setup(playerSlot);
    } else if (actionName === ACTION.CLEAN) {
        for (const obj of world.getAllObjects()) {
            if (obj != refObject) {
                obj.destroy();
            }
        }
    } else if (actionName === ACTION.COUNT) {
        console.log(`found ${world.getAllObjects().length} game objects`);
    } else if (actionName === ACTION.SPAWN_UNTIL_FAIL) {
        const warSunGuid = "1E2FD83447A7A22D4B459E9DC9B67C8E";
        const pos = new Vector(0, 0, world.getTableHeight());
        for (let i = 0; i < Number.MAX_VALUE; i++) {
            const obj = world.createObjectFromTemplate(warSunGuid, pos);
            if (!obj) {
                throw new Error(`failed after ${i} creates`);
            }
            i += 1;
            pos.z += 4;
        }
    } else if (actionName === ACTION.UNIT_ATTRS) {
        const unitUpgrades = UnitAttrs.getPlayerUnitUpgrades(player);
        const names = unitUpgrades.map((x) => x.name);
        console.log(`found unit upgrades: ${names}`);
    } else if (actionName === ACTION.UNIT_MODIFIERS) {
        const unitModifiers = UnitModifier.getPlayerUnitModifiers(
            player,
            "self"
        );
        const names = unitModifiers.map((x) => x.name);
        console.log(`found unit modifiers: ${names}`);
    }
});
