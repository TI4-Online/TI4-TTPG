// Container must have "bag.x" NSID, content "x".
// Protect against accidental right-click empty with periodic fill?

const assert = require("../../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { Spawn } = require("../../setup/spawn/spawn");
const {
    Container,
    GameObject,
    Player,
    globalEvents,
    refContainer,
} = require("../../wrapper/api");

class SingletonInfiniteContainer {
    constructor(gameObject) {
        assert(gameObject);
        assert(gameObject instanceof GameObject);
        assert(gameObject instanceof Container);

        // Might not have correct type on creation.
        //assert(gameObject.getType() === 1); // 3 technically ok

        const nsid = ObjectNamespace.getNsid(gameObject);
        const prefix = "bag.";
        assert(nsid.startsWith(prefix));

        this._container = gameObject;
        this._contentNsid = nsid.slice(prefix.length);

        this._container.onInserted.add((container, insertedObjects, player) => {
            assert(container instanceof Container);
            assert(Array.isArray(insertedObjects));
            assert(player instanceof Player);

            if (!this._container.isValid()) {
                return;
            }
            this.rejectMismatched(insertedObjects, player);
            this.removeExtras();
            this.refill();
        });

        this._container.onRemoved.add((container, removedObject, player) => {
            assert(container instanceof Container);
            assert(removedObject instanceof GameObject);
            assert(player instanceof Player);

            if (!this._container.isValid()) {
                return;
            }
            this.removeExtras(removedObject);
            this.refill(removedObject);
        });

        // On construction give caller a moment to finish setup.
        process.nextTick(() => {
            this.refill();
        });
    }

    /**
     * Scan added items, use onContainerRejected event to remove mismatched items.
     */
    rejectMismatched(insertedObjects, player) {
        assert(Array.isArray(insertedObjects));
        assert(player instanceof Player);

        const rejectedObjs = [];
        for (const obj of insertedObjects) {
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid !== this._contentNsid) {
                console.log(
                    `SingletonInfiniteContainer.rejectMismatched: rejecting "${nsid}"`
                );
                rejectedObjs.push(obj);
            }
        }
        if (rejectedObjs.length > 0) {
            globalEvents.TI4.onContainerRejected.trigger(
                this._container,
                rejectedObjs,
                player
            );
        }
    }

    /**
     * Keep at most one item.
     */
    removeExtras(removedObject) {
        assert(!removedObject || removedObject instanceof GameObject);

        // Get remaining correct objects.
        const matchingObjs = this._container.getItems().filter((obj) => {
            const nsid = ObjectNamespace.getNsid(obj);
            return obj !== removedObject && nsid === this._contentNsid;
        });

        // Keep one (if there is one).
        matchingObjs.shift();

        // Remove extra.
        matchingObjs.forEach((obj) => {
            console.log(
                `SingletonInfiniteContainer.removeExtras: removing extra "${this._contentNsid}"`
            );
            this._container.remove(obj);
        });
    }

    /**
     * Fill with an item if empty.
     */
    refill(removedObject) {
        assert(!removedObject || removedObject instanceof GameObject);

        // Get correct objects.
        const matchingObjs = this._container.getItems().filter((obj) => {
            const nsid = ObjectNamespace.getNsid(obj);
            return obj !== removedObject && nsid === this._contentNsid;
        });

        if (matchingObjs.length >= 1) {
            return;
        }

        console.log(
            `SingletonInfiniteContainer.refill: adding "${this._contentNsid}"`
        );

        const pos = this._container.getPosition().add([0, 0, 10]);
        const rot = this._container.getRotation();
        const obj = Spawn.spawn(this._contentNsid, pos, rot);
        assert(obj);

        this._container.addObjects([obj]);
    }
}

// Hold a reference to make sure the proxy object does not get removed.
const _doNotGC = new SingletonInfiniteContainer(refContainer);
assert(_doNotGC);
