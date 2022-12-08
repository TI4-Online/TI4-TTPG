const assert = require("../../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { UnitAttrs } = require("../../lib/unit/unit-attrs");
const {
    Color,
    Container,
    GameObject,
    Rotator,
    Vector,
    globalEvents,
    refContainer,
    world,
} = require("../wrapper/api");
const { WidgetFactory } = require("../../lib/ui/widget-factory");

const USE_SIMPLE_NUMBERS = true;

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

        this._container = container;
        this._unit = ObjectNamespace.parseUnitBag(container).unit;
        this._UIElement = false;
        this._boxes = undefined;
        this._simpleText = undefined;

        // Get capacity, do not use for figthers/infantry.
        const unitAttrs = UnitAttrs.getDefaultUnitAttrs(this._unit);
        this._capacity = unitAttrs.raw.unitCount;
        assert(this._capacity > 0);
        if (this._unit === "fighter" || this._unit === "infantry") {
            this._capacity = -1;
        }

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
            this._UIElement.anchorX = 0;
            this._UIElement.position = new Vector(-3, 0, 0.1);
            this._UIElement.rotation = new Rotator(0, 90, 0);
            this._UIElement.widget = this._simpleText;
            // Creator may change color.
            process.nextTick(() => {
                this._simpleText.setTextColor(
                    this._container.getPrimaryColor()
                );
            });
        } else {
            const boxesPanel = WidgetFactory.terticalBox().setChildDistance(
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
            this._UIElement.rotation = new Rotator(0, -90, 0);
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

// Hold a reference to make sure the proxy object does not get removed.
const _doNotGC = new UnitBag(refContainer);
assert(_doNotGC);
