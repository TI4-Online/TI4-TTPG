const assert = require("../../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { UNIT_DATA } = require("../../setup/setup-units");
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
    refObject,
    world,
} = require("../wrapper/api");

const boxHeight = 4;
const boxWidth = 14;
const boxGap = 1;
const xPos = -3.5;

class UnitBag {
    constructor(gameObject) {
        assert(gameObject instanceof Container);
        assert(ObjectNamespace.isUnitBag(gameObject));

        this._container = gameObject;
        this._unit = ObjectNamespace.parseUnitBag(gameObject).unit;
        this._UIElement = false;
        this._boxes = [];

        // Get capacity, do not use for figthers/infantry.
        this._capacity = -1;
        for (const unitData of UNIT_DATA) {
            if (unitData.unitNsid.endsWith(this._unit)) {
                this._capacity = unitData.unitCount;
                break;
            }
        }
        assert(this._capacity > 0);
        if (this._unit === "fighter" || this._unit === "infantry") {
            this._capacity = -1;
        }

        this.createUI();
        this.updateUI();

        // Watch for player-driven events.
        gameObject.onInserted.add((container, insertObjs, player) => {
            this.onInserted(container, insertObjs, player);
            this.updateUI();
        });
        gameObject.onRemoved.add((container, removedObj, player) => {
            this.updateUI();
        });

        // Patch mutators.  When a script adds or removes it does not trigger
        // the onInserted/onRemoved events.
        gameObject._addObjects = gameObject.addObjects;
        gameObject.addObjects = (...args) => {
            gameObject._addObjects(...args);
            this.updateUI();
        };
        gameObject._clear = gameObject.clear;
        gameObject.clear = (...args) => {
            gameObject._clear(...args);
            this.updateUI();
        };
        gameObject._insert = gameObject.insert;
        gameObject.insert = (...args) => {
            gameObject._insert(...args);
            this.updateUI();
        };
        gameObject._remove = gameObject.remove;
        gameObject.remove = (...args) => {
            gameObject._remove(...args);
            this.updateUI();
        };
        gameObject._removeAt = gameObject.removeAt;
        gameObject.removeAt = (...args) => {
            gameObject._removeAt(...args);
            this.updateUI();
        };
        gameObject._take = gameObject.take;
        gameObject.take = (...args) => {
            gameObject._take(...args);
            this.updateUI();
        };
        gameObject._takeAt = gameObject.takeAt;
        gameObject.takeAt = (...args) => {
            gameObject._takeAt(...args);
            this.updateUI();
        };
    }

    createUI() {
        const boxPanel = new VerticalBox().setChildDistance(boxGap);
        this._boxes = [];
        for (let i = 0; i < this._capacity; i++) {
            const box = new Border();
            boxPanel.addChild(box, 1);
            this._boxes.push(box);
        }

        this._UIElement = new UIElement();
        this._UIElement.useWidgetSize = false;
        this._UIElement.height =
            (boxHeight + boxGap) * this._boxes.length - boxGap;
        this._UIElement.width = boxWidth;
        this._UIElement.position = new Vector(xPos, 0, 0.1);
        this._UIElement.rotation = new Rotator(0, -90, 0);
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
        this._container.updateUI(this._UIElement);
    }

    shouldReject(insertedObj) {
        assert(insertedObj instanceof GameObject);

        if (!ObjectNamespace.isUnit(insertedObj)) {
            return true;
        }

        const parsed = ObjectNamespace.parseUnit(insertedObj);
        if (!parsed || parsed.unit !== this._unit) {
            return true;
        }

        const bagOwner = this._container.getOwningPlayerSlot();
        const objOwner = insertedObj.getOwningPlayerSlot();
        if (bagOwner !== objOwner) {
            return true;
        }
    }

    onInserted(container, insertObjs, player) {
        const rejectedObjs = insertObjs.filter((obj) => {
            return this.shouldReject(obj);
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

refObject.onCreated.add((obj) => {
    new UnitBag(obj);
});
if (world.getExecutionReason() === "ScriptReload") {
    new UnitBag(refObject);
}
