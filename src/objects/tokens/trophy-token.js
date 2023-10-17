const { Spawn } = require("../../setup/spawn/spawn");
const { Rotator, refObject, world } = require("../../wrapper/api");

const ACTION_NAME = "*Trophy";

refObject.addCustomAction(ACTION_NAME);

refObject.onCustomAction.add((obj, player, customActionName) => {
    if (customActionName === ACTION_NAME) {
        const pos = obj.getPosition();
        pos.z = world.getTableHeight() + 10;
        obj.setTags(["DELETED_ITEMS_IGNORE"]);
        obj.destroy();

        const rot = new Rotator(0, 0, 0);
        const trophy = Spawn.spawn("misc:base/trophy", pos, rot);
        trophy.snapToGround();
    }
});
