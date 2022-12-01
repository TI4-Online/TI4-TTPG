const assert = require("../../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { UnitAttrs } = require("../../lib/unit/unit-attrs");
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
} = require("../wrapper/api");

const BOX = {
    height: 4,
    width: 14,
    gap: 1,
    x: -3.8,
};

class UnitBag {
    constructor(container) {
        assert(container instanceof Container);
        assert(ObjectNamespace.isUnitBag(container));

        // "Can't happen" paranoid safety check.
        if (container._isUnitBag) {
            return;
        }
        container._isUnitBag = true;

        this._container = container;
        this._unit = ObjectNamespace.parseUnitBag(container).unit;
        this._UIElement = false;
        this._boxes = [];

        // Get capacity, do not use for figthers/infantry.
        const unitAttrs = UnitAttrs.getDefaultUnitAttrs(this._unit);
        this._capacity = unitAttrs.raw.unitCount;
        assert(this._capacity > 0);
        if (this._unit === "fighter" || this._unit === "infantry") {
            this._capacity = -1;
        }

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

        // Workaround for TTPG issue: on reload containers reset to player color.
        // Reset to plastic color.
        const playerSlot = container.getOwningPlayerSlot();
        const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
        if (playerDesk) {
            container.setPrimaryColor(playerDesk.plasticColor);
        }
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

let _createOnlyOnceCalled = false;
const createOnlyOnce = (obj) => {
    assert(obj instanceof GameObject);
    if (_createOnlyOnceCalled || world.__isMock) {
        return;
    }
    _createOnlyOnceCalled = true;
    new UnitBag(obj);
};

refContainer.onCreated.add((obj) => {
    // DO NOT CREATE UI IN ONCREATED CALLBACK, IT WILL LINGER ACROSS RELOAD
    // AND PROBABLY CAUSES OTHER PROBLEMS.
    process.nextTick(() => {
        createOnlyOnce(obj);
    });
});

if (world.getExecutionReason() === "ScriptReload") {
    process.nextTick(() => {
        createOnlyOnce(refContainer);
    });
}
