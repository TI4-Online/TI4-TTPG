const assert = require("../../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../../lib/object-namespace");
const {
    Container,
    GameObject,
    Player,
    globalEvents,
    refObject,
    world,
} = require("../../wrapper/api");
const { Spawn } = require("../../setup/spawn/spawn");

class ControlTokenContainer {
    constructor(gameObject) {
        assert(gameObject);
        assert(gameObject instanceof GameObject);
        assert(gameObject instanceof Container);

        // Might not have correct type on creation.
        //assert(gameObject.getType() === 1); // 3 technically ok

        const nsid = ObjectNamespace.getNsid(gameObject);
        assert(nsid === "bag.token.control:base/*");

        this._container = gameObject;

        const doUpdate = () => {
            if (!this._container.isValid()) {
                return;
            }
            this.rejectMismatched();
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
            if (
                !ObjectNamespace.isControlToken(obj) ||
                obj.getOwningPlayerSlot() !==
                    this._container.getOwningPlayerSlot()
            ) {
                const nsid = ObjectNamespace.getNsid(obj);
                console.log(
                    `ControlTokenContainer.rejectMismatched: rejecting "${nsid}"`
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
            assert(ObjectNamespace.isControlToken(obj));
            assert(
                obj.getOwningPlayerSlot() ===
                    this._container.getOwningPlayerSlot()
            );

            if (index > 0) {
                const nsid = ObjectNamespace.getNsid(obj);
                console.log(
                    `ControlTokenContainer.removeExtras: removing extra "${nsid}"`
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

        const playerSlot = this._container.getOwningPlayerSlot();
        const faction = world.TI4.getFactionByPlayerSlot(playerSlot);
        if (!faction) {
            console.log("ControlTokenContainer.refill: no faction");
            return;
        }

        const tokenNsid = `token.control:${faction.nsidSource}/${faction.nsidName}`;
        console.log(`ControlTokenContainer.refill: adding "${tokenNsid}"`);

        const pos = this._container.getPosition().add([0, 0, 10]);
        const rot = this._container.getRotation();
        const obj = Spawn.spawn(tokenNsid, pos, rot);
        assert(obj);

        this._container.addObjects([obj]);
    }
}

new ControlTokenContainer(refObject);
