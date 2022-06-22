// Container must have "bag.x" NSID, content "x".
// Protect against accidental right-click empty with periodic fill?

const assert = require("../../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../../lib/object-namespace");
const {
    Container,
    GameObject,
    Player,
    globalEvents,
    refObject,
} = require("../../wrapper/api");
const { Spawn } = require("../../setup/spawn/spawn");

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

        const doUpdate = (player) => {
            if (!this._container.isValid()) {
                return;
            }
            this.rejectMismatched(player);
            this.removeExtras();
            this.refill();
        };

        this._container.onInserted.add((container, insertedObjects, player) => {
            doUpdate(player);
        });
        this._container.onRemoved.add((container, removedObject, player) => {
            doUpdate(player);
        });

        // On construction give caller a moment to finish setup.
        process.nextTick(() => {
            doUpdate(undefined);
        });
    }

    /**
     * Scan content, use onContainerRejected event to remove mismatched items.
     */
    rejectMismatched(player) {
        assert(!player || player instanceof Player);

        const rejectedObjs = [];
        for (const obj of this._container.getItems()) {
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
    removeExtras() {
        this._container.getItems().forEach((obj, index) => {
            assert(obj instanceof GameObject);
            assert(typeof index === "number");

            // Call `rejectMismatched` first to enforce content type.
            const nsid = ObjectNamespace.getNsid(obj);
            assert(nsid === this._contentNsid);

            if (index > 0) {
                console.log(
                    `SingletonInfiniteContainer.removeExtras: removing extra "${nsid}"`
                );
                this._container.remove(obj);
            }
        });
    }

    /**
     * Fill with an item if empty.
     */
    refill() {
        if (this._container.getNumItems() >= 1) {
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

new SingletonInfiniteContainer(refObject);
