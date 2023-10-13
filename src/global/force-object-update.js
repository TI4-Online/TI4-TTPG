const assert = require("../wrapper/assert-wrapper");
const {
    GameObject,
    ObjectType,
    globalEvents,
    world,
} = require("../wrapper/api");

const VERBOSE = false;
const NUM_POKES = 3;
const MAX_POKES_PER_INTERVAL = 100;
const EXPIRE_DELAY_MSECS = 1000; // watch out for self-triggering

/**
 * Reports of map tiles not showing for some, flipping units not getting flipped for some, etc.
 *
 * When an object is created or moved, queue it for forced updates hopefully making sure
 * any transform changes get propagated.
 */
class ForceObjectUpdate {
    constructor() {
        // Array.{obj:GameObject,pokesRemaining:number,pos:Vector,lastPokeTimestamp:number}, newest at back.
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
            }, 200);
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

        // Be careful that our own setPosition doesn't keep triggering this.
        // Ignore request if already in the poke queue, and queue processing
        // leaves the entry in place a short while after the last setPosition.
        for (const entry of this._pokeQueue) {
            if (entry.obj === obj) {
                return; // already being processed
            }
        }

        this._pokeQueue.push({
            obj,
            pokesRemaining: NUM_POKES,
            pos: obj.getPosition(),
            lastPokeTimestamp: Date.now(),
        });
    }

    pokeEntries() {
        // Fast exit if nothing to do.
        if (this._pokeQueue.length === 0) {
            return;
        }

        if (VERBOSE) {
            console.log(`ForceObjectUpdate: |poke|=${this._pokeQueue.length}`);
        }

        // Get the to-poke entries.
        const toPokeCount = Math.min(
            this._pokeQueue.length,
            MAX_POKES_PER_INTERVAL
        );
        const toPoke = this._pokeQueue.splice(0, toPokeCount);

        // Poke, and if young return to end of queue.
        const now = Date.now();
        for (const entry of toPoke) {
            if (entry.pokesRemaining > 0) {
                this.pokeEntry(entry);
                entry.pokesRemaining -= 1;
                entry.lastPokeTimestamp = now;
            }
            // Return to queue if needs more and/or is young (keep around for
            // a moment to prevent our own poke from retriggering).
            const age = now - entry.lastPokeTimestamp;
            if (entry.pokesRemaining > 0 || age < EXPIRE_DELAY_MSECS) {
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
        // So... move by a small amount (e.g. z 0.01).  If this doesn't help
        // maybe bring out the hammer and clone replace (oof bad).

        const pos = obj.getPosition();
        const rot = obj.getRotation();

        // Paranoia: abort if moved too far from original record's position.
        const dSq = pos.subtract(entry.pos).magnitudeSquared();
        if (dSq > 0.1) {
            return; // moved too much
        }

        // Poke, alternate directions to remain mostly stable.
        const dir = entry.pokesRemaining % 2 === 1 ? 1 : -1;
        pos.z += 0.021 * dir;
        rot.yaw += 0.021 * dir;

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
