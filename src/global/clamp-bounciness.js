const { ObjectNamespace } = require("../lib/object-namespace");
const { Dice, globalEvents, world } = require("../wrapper/api");

function onHitHandler(obj) {
    obj.setLinearVelocity([0, 0, 0]);
    obj.setAngularVelocity([0, 0, 0]);
}

function clampBounciness(obj) {
    if (!(obj instanceof Dice)) {
        const nsid = ObjectNamespace.getNsid(obj);
        if (nsid.startsWith("token") || nsid.startsWith("unit")) {
            let bounciness = obj.getBounciness();
            bounciness = Math.min(bounciness, 0); // all the way down
            obj.setBounciness(bounciness);

            // In addition to clamping bounciness, stop it on hit.
            obj.onHit.add(onHitHandler);
        }
    }
}

for (const obj of world.getAllObjects(false)) {
    clampBounciness(obj);
}

globalEvents.onObjectCreated.add((obj) => {
    clampBounciness(obj);
});
