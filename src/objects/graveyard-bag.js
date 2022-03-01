const assert = require("../wrapper/assert-wrapper");
const {
    Container,
    Player,
    globalEvents,
    refObject,
    world,
} = require("../wrapper/api");

class GraveyardBag {
    constructor(container) {
        assert(container instanceof Container);
        container.onInserted.add((container, insertedObjects, player) => {
            assert(container instanceof Container);
            assert(Array.isArray(insertedObjects));
            assert(player instanceof Player);

            globalEvents.TI4.onContainerRejected.trigger(
                container,
                insertedObjects,
                player
            );
        });
    }
}

refObject.onCreated.add((obj) => {
    new GraveyardBag(obj);
});

if (world.getExecutionReason() === "ScriptReload") {
    new GraveyardBag(refObject);
}
