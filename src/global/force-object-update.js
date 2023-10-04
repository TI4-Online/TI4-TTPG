/**
 * Reports of map tiles not showing for some, flipping units not getting flipped for some, etc.
 *
 * When an object is created or moved, queue it for forced updates hopefully making sure
 * any status changes get propagated.
 */

const { globalEvents, world } = require("../wrapper/api");

const VERBOSE = false;
const NUM_UPDATE_STAGES = 5;
const LIMIT_UPDATES_PER_STAGE = 20;

class ForceObjectUpdate {
    constructor() {
        throw new Error("static only");
    }

    // Force update a few times, migrating objects down the set list.
    static _forceUpdateSets = new Array(NUM_UPDATE_STAGES).fill(0).map(() => {
        return new Set();
    });
    static _forceUpdateIndex = 0;

    static _onObjectCreated = (obj) => {
        ForceObjectUpdate.addHandlers(obj);
        ForceObjectUpdate.queue(obj);
    };

    static _onMovementStopped = (obj) => {
        ForceObjectUpdate.queue(obj);
    };

    static addHandlers(obj) {
        obj.onMovementStopped.add(ForceObjectUpdate._onMovementStopped);
        obj.onSnapped.add(ForceObjectUpdate._onMovementStopped);
        obj.onSnappedToGrid.add(ForceObjectUpdate._onMovementStopped);
    }

    static queue(obj) {
        // Requeue in the first set.
        for (const set of ForceObjectUpdate._forceUpdateSets) {
            set.delete(obj);
        }
        ForceObjectUpdate._forceUpdateSets[0].add(obj);
    }

    static processSome() {
        const i = ForceObjectUpdate._forceUpdateIndex;

        const thisSet = ForceObjectUpdate._forceUpdateSets[i];
        const nextSet = ForceObjectUpdate._forceUpdateSets[i + 1];

        let numProcessed = 0;
        for (const obj of thisSet) {
            // Get the object, also queue for another nudge next cycle.
            thisSet.delete(obj);
            if (!obj.isValid()) {
                continue; // deleted
            }
            if (obj.isHeld()) {
                continue; // wait for player to drop it to process
            }
            if (nextSet) {
                nextSet.add(obj);
            }

            // Nudge the object to force it to re-propagate.
            // Editing the tags might be enough to push the full object.
            const prefix = "_fou_";
            const tags = obj.getTags().filter((tag) => !tag.startsWith(prefix));
            if (nextSet) {
                tags.push(`${prefix}${i}`);
            }
            obj.setTags(tags);
            if (VERBOSE) {
                console.log(
                    `ForceObjectUpdate.processSome ${i + 1}@${
                        numProcessed + 1
                    } "${obj.getId()}" [${tags.join(", ")}]`
                );
            }

            // Process everything in the first batch, throttle later batches.
            // Do this because if physics is going nuts and some objects are
            // firing onMovementStopped often, make sure other well behaved
            // objects move through the stages.
            numProcessed += 1;
            if (i > 0 && numProcessed >= LIMIT_UPDATES_PER_STAGE) {
                break;
            }
        }

        if (thisSet.size === 0) {
            ForceObjectUpdate._forceUpdateIndex =
                (i + 1) % ForceObjectUpdate._forceUpdateSets.length;
        }
    }
}

globalEvents.onObjectCreated.add((obj) => {
    ForceObjectUpdate._onObjectCreated(obj);
});

const skipContained = false;
for (const obj of world.getAllObjects(skipContained)) {
    ForceObjectUpdate.addHandlers(obj);
}

// globalEvents.onTick.add(() => {
//     ForceObjectUpdate.processSome();
// });

setInterval(() => {
    ForceObjectUpdate.processSome();
}, 100);
