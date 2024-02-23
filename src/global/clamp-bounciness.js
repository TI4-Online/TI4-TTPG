const { globalEvents, world } = require("@tabletop-playground/api");

function clampBounciness(obj) {
    let bounciness = obj.getBounciness();
    bounciness = Math.min(bounciness, 0.1);
    obj.setBounciness(bounciness);
}

for (const obj of world.getAllObjects(false)) {
    clampBounciness(obj);
}

globalEvents.onObjectCreated.add((obj) => {
    clampBounciness(obj);
});
