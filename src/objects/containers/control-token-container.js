const assert = require("../../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../../lib/object-namespace");
const {
    Container,
    GameObject,
    Player,
    globalEvents,
    refContainer,
    world,
} = require("../../wrapper/api");
const { Spawn } = require("../../setup/spawn/spawn");

class ControlTokenContainer {
    constructor(container) {
        assert(container);
        assert(container instanceof GameObject);
        assert(container instanceof Container);

        // Might not have correct type on creation.
        //assert(gameObject.getType() === 1); // 3 technically ok

        const nsid = ObjectNamespace.getNsid(container);
        assert(nsid === "bag.token.control:base/*");

        this._container = container;

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
            if (!this._container.isValid()) {
                return;
            }
            this.refill();
        });

        // Workaround for TTPG issue: on reload containers reset to player color.
        // Reset to plastic color.
        const playerSlot = container.getOwningPlayerSlot();
        const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
        if (playerDesk) {
            container.setPrimaryColor(playerDesk.plasticColor);
        }
    }

    /**
     * Scan content, use onContainerRejected event to remove mismatched items.
     */
    rejectMismatched(insertedObjects, player) {
        assert(Array.isArray(insertedObjects));
        assert(player instanceof Player);

        const rejectedObjs = [];
        for (const obj of insertedObjects) {
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
    removeExtras(removedObject) {
        assert(!removedObject || removedObject instanceof GameObject);

        // Get remaining correct objects.
        const matchingObjs = this._container.getItems().filter((obj) => {
            return (
                obj !== removedObject &&
                ObjectNamespace.isControlToken(obj) &&
                obj.getOwningPlayerSlot() ===
                    this._container.getOwningPlayerSlot()
            );
        });

        // Keep one (if there is one).
        matchingObjs.shift();

        // Remove extra.
        matchingObjs.forEach((obj) => {
            const nsid = ObjectNamespace.getNsid(obj);
            console.log(
                `SingletonInfiniteContainer.removeExtras: removing extra "${nsid}"`
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
            return (
                obj !== removedObject &&
                ObjectNamespace.isControlToken(obj) &&
                obj.getOwningPlayerSlot() ===
                    this._container.getOwningPlayerSlot()
            );
        });

        if (matchingObjs.length >= 1) {
            return;
        }

        const playerSlot = this._container.getOwningPlayerSlot();
        const faction = world.TI4.getFactionByPlayerSlot(playerSlot);
        if (!faction) {
            console.log(
                `ControlTokenContainer.refill: no faction for playerSlot ${playerSlot}`
            );
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

// Hold a reference to make sure the proxy object does not get removed.
const _doNotGC = new ControlTokenContainer(refContainer);
assert(_doNotGC);
