const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { Broadcast } = require("../../lib/broadcast");
const { ObjectNamespace } = require("../../lib/object-namespace");
const TriggerableMulticastDelegate = require("../../lib/triggerable-multicast-delegate");
const { COMMAND_TOKENS } = require("../../setup/faction/setup-faction-tokens");
const {
    Color,
    Container,
    GameObject,
    Rotator,
    Vector,
    globalEvents,
    refContainer,
    world,
} = require("../../wrapper/api");
const { WidgetFactory } = require("../../lib/ui/widget-factory");

const USE_SIMPLE_NUMBERS = true;

const BOX = {
    height: 4,
    width: 14,
    gap: 1,
    x: -3.8,
};

const DELAY = 5000; // delay in milliseconds before reporting

function holdsObject(container, obj) {
    assert(container instanceof Container);
    assert(obj instanceof GameObject);

    if (!ObjectNamespace.isCommandTokenBag(container)) {
        return false;
    }
    if (!ObjectNamespace.isCommandToken(obj)) {
        return false;
    }
    const bagOwner = container.getOwningPlayerSlot();
    const tokenOwner = obj.getOwningPlayerSlot();
    if (bagOwner != tokenOwner) {
        return false;
    }
    return true;
}

class Reporter {
    constructor(container) {
        assert(container instanceof Container);
        this._container = container;

        // arrow functions necessary to get proper "this" value
        this._container.onInserted.add((container, objects) =>
            this.countInserted(container, objects)
        );
        this._container.onRemoved.add((container, object) =>
            this.countRemoved(container, object)
        );

        // When a script inserts the events do not fire.  Offer an event-like
        // such scripts can call.  For now only do this for inserts as players
        // can drop tokens in graveyards instead of bag.
        this._container.__notifyInserted = new TriggerableMulticastDelegate();
        this._container.__notifyInserted.add((container, objects) => {
            this.countInserted(container, objects);
        });

        this._insertedCounter = 0;
        this._firstInserted = false;

        this._removedCounter = 0;
        this._firstRemoved = false;
    }

    countInserted(container, objects) {
        // ensure each inserted object belongs in the container before counting
        // it toward the number of inserted objects
        let addedValidObject = false;
        for (const obj of objects) {
            if (!holdsObject(container, obj)) {
                continue;
            }
            this._insertedCounter++;
            addedValidObject = true;
        }
        if (addedValidObject && !this._firstInserted) {
            this._firstInserted = true;
            setTimeout(() => {
                const playerSlot = container.getOwningPlayerSlot();
                const playerDesk =
                    world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
                const playerName = world.TI4.getNameByPlayerSlot(playerSlot);
                const color = playerDesk ? playerDesk.chatColor : undefined;
                Broadcast.chatAll(
                    locale("ui.message.command_tokens_inserted", {
                        factionName: playerName,
                        count: this._insertedCounter,
                    }),
                    color
                );
                this._insertedCounter = 0;
                this._firstInserted = false;
            }, DELAY);
        }
    }

    countRemoved(container, object) {
        // ensure the object belongs in the container before counting it
        // towards the number of removed objects
        if (!holdsObject(container, object)) {
            return;
        }
        this._removedCounter++;
        if (!this._firstRemoved) {
            this._firstRemoved = true;
            setTimeout(() => {
                const playerSlot = container.getOwningPlayerSlot();
                const playerDesk =
                    world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
                const playerName = world.TI4.getNameByPlayerSlot(playerSlot);
                const color = playerDesk ? playerDesk.chatColor : undefined;
                Broadcast.chatAll(
                    locale("ui.message.command_tokens_removed", {
                        factionName: playerName,
                        count: this._removedCounter,
                    }),
                    color
                );
                this._removedCounter = 0;
                this._firstRemoved = false;
            }, DELAY);
        }
    }
}

class CommandTokenContainer {
    constructor(container) {
        assert(container instanceof Container);
        assert(ObjectNamespace.isCommandTokenBag(container));

        this._container = container;
        this._UIElement = false;
        this._boxes = undefined;
        this._simpleText = undefined;

        this._capacity = COMMAND_TOKENS.tokenCount;

        this._reportedCount = -1;

        this.createUI();
        this.updateUI();

        // Watch for player-driven events.
        container.onInserted.add((container, insertObjs, player) => {
            this.onInserted(container, insertObjs, player);
            this.updateUI();
        });
        container.onRemoved.add((container, removedObj, player) => {
            this.updateUI();
        });

        // Events do not trigger when scripts add/remove items.  An earlier
        // version interposed on script accessors, but a few crash reports
        // suggest that can get into an infinite loop somehow.  Keep it
        // simple and simply periodically update.
        let handle = undefined;
        const periodicUpdate = () => {
            this.updateUI();
            const delay = 0.5 + Math.random() * 0.5;
            handle = setTimeout(periodicUpdate, delay);
        };
        periodicUpdate();
        container.onDestroyed.add(() => {
            if (handle) {
                clearTimeout(handle);
            }
        });

        // Workaround for TTPG issue: on reload containers reset to player color.
        // Reset to plastic color.
        const playerSlot = container.getOwningPlayerSlot();
        const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
        if (playerDesk) {
            container.setPrimaryColor(playerDesk.plasticColor);
        }
    }

    createUI() {
        this._UIElement = WidgetFactory.uiElement();
        if (USE_SIMPLE_NUMBERS) {
            this._simpleText = WidgetFactory.text()
                .setFontSize(10)
                .setTextColor(this._container.getPrimaryColor());
            this._UIElement.anchorX = 1;
            this._UIElement.position = new Vector(-3, 0, 0.1);
            this._UIElement.rotation = new Rotator(0, -90, 0);
            this._UIElement.widget = this._simpleText;
            // Creator may change color.
            process.nextTick(() => {
                this._simpleText.setTextColor(
                    this._container.getPrimaryColor()
                );
            });
        } else {
            const boxesPanel = WidgetFactory.verticalBox().setChildDistance(
                BOX.gap
            );
            this._boxes = [];
            for (let i = 0; i < this._capacity; i++) {
                const box = WidgetFactory.border();
                boxesPanel.addChild(box, 1);
                this._boxes.push(box);
            }
            this._UIElement.useWidgetSize = false;
            this._UIElement.height =
                (BOX.height + BOX.gap) * this._boxes.length - BOX.gap;
            this._UIElement.width = BOX.width;
            this._UIElement.position = new Vector(BOX.x, 0, 0.1);
            this._UIElement.rotation = new Rotator(0, 90, 0);
            this._UIElement.widget = boxesPanel;
        }

        this._container.addUI(this._UIElement);
    }

    updateUI() {
        const currentNumber = this._container.getNumItems();
        if (currentNumber === this._reportedCount) {
            return;
        }
        this._reportedCount = currentNumber;
        if (USE_SIMPLE_NUMBERS) {
            let text;
            if (this._capacity > 0) {
                text = `${currentNumber}/${this._capacity}`;
            } else {
                text = `${currentNumber}`;
            }
            this._simpleText.setText(text);
        } else {
            const emptyColor = new Color(0.2, 0.2, 0.2);
            const fullColor = this._container.getPrimaryColor();
            this._boxes.forEach((box, index) => {
                const color = index < currentNumber ? fullColor : emptyColor;
                box.setColor(color);
            });
        }
    }

    onInserted(container, insertObjs, player) {
        const rejectedObjs = insertObjs.filter((obj) => {
            return !holdsObject(this._container, obj);
        });
        if (rejectedObjs.length > 0) {
            globalEvents.TI4.onContainerRejected.trigger(
                container,
                rejectedObjs,
                player
            );
        }
    }
}

// Hold a reference to make sure the proxy object does not get removed.
const _doNotGC = new CommandTokenContainer(refContainer);
assert(_doNotGC);
const _doNotGC2 = new Reporter(refContainer);
assert(_doNotGC2);
