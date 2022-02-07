const { SimpleDieBuilder } = require("./simple-die");
const { Color, Vector, refObject, world } = require("@tabletop-playground/api");

const ACTION = {
    SPAWN_AND_ROLL: "Spawn & roll",
};

for (const action of Object.values(ACTION)) {
    refObject.addCustomAction(action);
}

refObject.onCustomAction.add((obj, player, actionName) => {
    console.log(`${player.getName()} selected ${actionName}`);

    if (actionName === ACTION.SPAWN_AND_ROLL) {
        const simpleDie = new SimpleDieBuilder()
            .setColor(new Color(1, 0, 0, 1))
            .setDeleteAfterSeconds(30)
            .setHitValue(11) // always miss, to force reroll
            .setName("my die")
            .setReroll(true)
            .setSpawnPosition(new Vector(10, 0, world.getTableHeight() + 20))
            .build(player);

        simpleDie.roll((simpleDie) => {
            console.log(`ROLLED ${simpleDie.getValueStr()}`);
        });
    }
});
