const { Dice } = require("@tabletop-playground/api");
const { globalEvents, world } = require("../wrapper/api");

function clampBounciness(obj) {
    if (!(obj instanceof Dice)) {
        let bounciness = obj.getBounciness();
        bounciness = Math.min(bounciness, 0); // all the way down
        obj.setBounciness(bounciness);
    }
}

for (const obj of world.getAllObjects(false)) {
    clampBounciness(obj);
}

globalEvents.onObjectCreated.add((obj) => {
    clampBounciness(obj);
});
