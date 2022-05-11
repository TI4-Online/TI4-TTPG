const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { Broadcast } = require("../../lib/broadcast");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { COMMAND_TOKENS } = require("../../setup/faction/setup-faction-tokens");
const {
    Border,
    Color,
    Container,
    GameObject,
    Rotator,
    UIElement,
    Vector,
    VerticalBox,
    globalEvents,
    refContainer,
    world,
} = require("../../wrapper/api");

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

function getFactionName(obj) {
    assert(obj instanceof GameObject);

    // cant get the faction name from the container because the container has name "*"
    // therefore get it from the command token object
    assert(ObjectNamespace.isCommandToken(obj));
    const nsidName = ObjectNamespace.parseCommandToken(obj).name;
    const faction = world.TI4.getFactionByNsidName(nsidName);
    return faction ? faction.nameFull() : nsidName;
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

        this._insertedCounter = 0;
        this._firstInserted = false;

        this._removedCounter = 0;
        this._firstRemoved = false;
    }

    countInserted(container, objects) {
        // ensure each inserted object belongs in the container before counting
        // it toward the number of inserted objects
        let addedValidObject = false;
        let factionName = null;
        for (const obj of objects) {
            if (!holdsObject(container, obj)) {
                continue;
            }
            this._insertedCounter++;
            addedValidObject = true;
            factionName = getFactionName(obj);
        }
        if (addedValidObject && !this._firstInserted) {
            this._firstInserted = true;
            setTimeout(() => {
                Broadcast.chatAll(
                    locale("ui.message.command_tokens_inserted", {
                        factionName: factionName,
                        count: this._insertedCounter,
                    })
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
                Broadcast.chatAll(
                    locale("ui.message.command_tokens_removed", {
                        factionName: getFactionName(object),
                        count: this._removedCounter,
                    })
                );
                this._removedCounter = 0;
                this._firstRemoved = false;
            }, DELAY);
        }
    }
}

class CommandTokenBag {
    constructor(container) {
        assert(container instanceof Container);
        assert(ObjectNamespace.isCommandTokenBag(container));

        this._container = container;
        this._UIElement = false;
        this._boxes = [];

        this._capacity = COMMAND_TOKENS.tokenCount;

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

        // Patch mutators.  When a script adds or removes it does not trigger
        // the onInserted/onRemoved events.
        container._addObjects = container.addObjects;
        container.addObjects = (...args) => {
            const r = container._addObjects(...args);
            this.updateUI();
            return r;
        };
        container._clear = container.clear;
        container.clear = (...args) => {
            const r = container._clear(...args);
            this.updateUI();
            return r;
        };
        container._insert = container.insert;
        container.insert = (...args) => {
            const r = container._insert(...args);
            this.updateUI();
            return r;
        };
        container._remove = container.remove;
        container.remove = (...args) => {
            const r = container._remove(...args);
            this.updateUI();
            return r;
        };
        container._removeAt = container.removeAt;
        container.removeAt = (...args) => {
            const r = container._removeAt(...args);
            this.updateUI();
            return r;
        };
        container._take = container.take;
        container.take = (...args) => {
            const r = container._take(...args);
            this.updateUI();
            return r;
        };
        container._takeAt = container.takeAt;
        container.takeAt = (...args) => {
            const r = container._takeAt(...args);
            this.updateUI();
            return r;
        };
    }

    createUI() {
        const boxPanel = new VerticalBox().setChildDistance(BOX.gap);
        this._boxes = [];
        for (let i = 0; i < this._capacity; i++) {
            const box = new Border();
            boxPanel.addChild(box, 1);
            this._boxes.push(box);
        }

        this._UIElement = new UIElement();
        this._UIElement.useWidgetSize = false;
        this._UIElement.height =
            (BOX.height + BOX.gap) * this._boxes.length - BOX.gap;
        this._UIElement.width = BOX.width;
        this._UIElement.position = new Vector(BOX.x, 0, 0.1);
        this._UIElement.rotation = new Rotator(0, 90, 0);
        this._UIElement.widget = boxPanel;

        this._container.addUI(this._UIElement);
    }

    updateUI() {
        const currentNumber = this._container.getNumItems();
        const emptyColor = new Color(0.2, 0.2, 0.2);
        const fullColor = this._container.getPrimaryColor();
        this._boxes.forEach((box, index) => {
            const color = index < currentNumber ? fullColor : emptyColor;
            box.setColor(color);
        });
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

refContainer.onCreated.add((obj) => {
    new CommandTokenBag(obj);
    new Reporter(obj);
});

if (world.getExecutionReason() === "ScriptReload") {
    new CommandTokenBag(refContainer);
    new Reporter(refContainer);
}
