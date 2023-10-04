const assert = require("../wrapper/assert-wrapper");
const {
    GameObject,
    ObjectType,
    globalEvents,
    world,
} = require("../wrapper/api");

const VERBOSE = false;
const NUM_POKES = 5;
const MAX_POKES_PER_INTERVAL = 100;

/**
 * Reports of map tiles not showing for some, flipping units not getting flipped for some, etc.
 *
 * When an object is created or moved, queue it for forced updates hopefully making sure
 * any transform changes get propagated.
 */
class ForceObjectUpdate {
    constructor() {
        // Array.{obj:GameObject,pokesRemaining:number}, newest at back.
        this._pokeQueue = [];

        this._markDirtyHandler = (obj) => {
            this.markDirty(obj);
        };

        globalEvents.onObjectCreated.add((obj) => {
            this.registerObject(obj);
            this.markDirty(obj);
        });

        const skipContained = false;
        for (const obj of world.getAllObjects(skipContained)) {
            this.registerObject(obj);
        }

        if (!world.__isMock) {
            setInterval(() => {
                this.pokeEntries();
            }, 100);
        }
    }

    registerObject(obj) {
        assert(obj instanceof GameObject);
        obj.onMovementStopped.add(this._markDirtyHandler);
        obj.onSnapped.add(this._markDirtyHandler);
        obj.onSnappedToGrid.add(this._markDirtyHandler);
    }

    markDirty(obj) {
        assert(obj instanceof GameObject);
        this._pokeQueue = this._pokeQueue.filter((entry) => entry.obj !== obj);
        this._pokeQueue.push({
            obj,
            pokesRemaining: NUM_POKES,
            pos: obj.getPosition(),
        });
    }

    pokeEntries() {
        // Fast exit if nothing to do.
        if (this._pokeQueue.length === 0) {
            return;
        }

        // Get the to-poke entries.
        const toPokeCount = Math.min(
            this._pokeQueue.length,
            MAX_POKES_PER_INTERVAL
        );
        const toPoke = this._pokeQueue.splice(0, toPokeCount);

        // Poke, and return to end of queue if needs future pokes.
        for (const entry of toPoke) {
            this.pokeEntry(entry);
            entry.pokesRemaining -= 1;
            if (entry.pokesRemaining > 0) {
                this._pokeQueue.push(entry);
            }
        }
    }

    pokeEntry(entry) {
        assert(entry.obj instanceof GameObject);
        assert(typeof entry.pokesRemaining === "number");
        assert(typeof entry.pos.x === "number");

        const obj = entry.obj;
        const objType = obj.getObjectType();

        if (!obj.isValid()) {
            return; // destroyed
        }
        if (obj.isHeld()) {
            return; // leave be, will mark dirty when dropped
        }
        if (objType !== ObjectType.Regular) {
            return; // do not attempt if locked
        }

        // "comparison of previous to current values happens between ticks (or
        // at larger intervals), a propagation is not triggered immediately"
        // So... we could move by a small amount (e.g. z 0.01), or bring out
        // the hammer and clone replace.

        const pos = obj.getPosition();
        const rot = obj.getRotation();

        // Paranoia: abort if moved too far from original record's position.
        const dSq = pos.subtract(entry.pos).magnitudeSquared();
        if (dSq > 0.1) {
            return; // moved too much
        }

        // Poke, alternate directions to remain mostly stable.
        const dir = entry.pokesRemaining % 2 === 1 ? 1 : -1;
        pos.z += 0.011 * dir;
        rot.yaw += 0.011 * dir;

        obj.setPosition(pos);
        obj.setRotation(rot);

        if (VERBOSE) {
            const id = obj.getId();
            const n = entry.pokesRemaining;
            console.log(
                `ForceObjectUpdate.pokeObject "${id}" ${n} ${pos} ${rot}`
            );
        }
    }
}

new ForceObjectUpdate();
