const assert = require("../../wrapper/assert-wrapper");
const TriggerableMulticastDelegate = require("../triggerable-multicast-delegate");
const {
    Border,
    Button,
    Canvas,
    CheckBox,
    HorizontalAlignment,
    HorizontalBox,
    ImageButton,
    ImageWidget,
    LayoutBox,
    MultilineTextBox,
    Panel,
    Rotator,
    ScreenUIElement,
    Slider,
    Text,
    TextBox,
    TextJustification,
    TextWidgetBase,
    Vector,
    VerticalAlignment,
    VerticalBox,
    UIElement,
    Widget,
    globalEvents,
    refPackageId,
    world,
} = require("../../wrapper/api");

// ----------------------------------------------------------------------------

const RECYCLE = true;
const INVENTORY_CAP = 600;

const dummyUi = new UIElement();

if (!world.__isMock) {
    console.log(`WidgetFactory RECYCLE=${RECYCLE} cap=${INVENTORY_CAP}`);
}

/**
 * Manage a widget type.
 *
 * Creating a widget first attempts to recycle from a freelist, freeing one
 * adds to the list (up to a size cap).
 */
class WidgetInventoryEntry {
    constructor(createOne) {
        assert(typeof createOne === "function");
        this._createOne = createOne;
        this._free = [];
        this._active = [];
    }

    push(widget) {
        if (!RECYCLE) {
            return;
        }

        if (widget._onFreed) {
            widget._onFreed.trigger(widget);
            widget._onFreed.clear();
        }

        // Remove from active.  REQUIRE it be active, otherwise it may have
        // been afflicted by the Unreal JS widget proxy bug.  Likewise this
        // catches any double-release bugs.
        const index = this._active.indexOf(widget);
        if (index < 0) {
            return; // not created by WidgetFactory (or maybe double released).
        }
        this._active.splice(index, 1);

        // If free is full abandon object.
        if (this._free.length >= INVENTORY_CAP) {
            return;
        }

        if (widget instanceof Widget) {
            try {
                dummyUi.widget = widget;
                world.addUI(dummyUi);
                world.removeUIElement(dummyUi);
            } catch (e) {
                console.log(
                    `WidgetFactory WIDGET "${widget.constructor.name}" IN USE DURING FREE`
                );
                return;
            }
        }

        // Return to free.
        this._free.push(widget);
    }

    popOrCreate() {
        if (!RECYCLE) {
            return this._createOne();
        }

        let widget = undefined;
        while (this._free.length > 0) {
            widget = this._free.pop();
            if (widget instanceof Widget) {
                try {
                    dummyUi.widget = widget;
                    world.addUI(dummyUi);
                    world.removeUIElement(dummyUi);
                    break; // success! use this widget
                } catch (e) {
                    console.log(
                        `WidgetFactory WIDGET "${widget.constructor.name}" IN USE, trying again`
                    );
                    widget = undefined;
                }
            }
        }

        if (!widget) {
            widget = this._createOne();

            // Add a field to verify object was not recreated when freeing.
            widget._isWidgetFactory = true;

            // Add a per-widget event triggered when freed.
            // This is useful for paranoid callers who want to
            // make sure they no longer attempt to update it later.
            // (e.g. the agenda summary UI that can get dismissed
            // in a variety of ways, this method safeguards against
            // forgetting to clean up in a release path.)
            widget._onFreed = new TriggerableMulticastDelegate();

            // Track allocations to find leaks.
            widget._alloc = [];
        }
        this._active.push(widget);

        assert(
            widget instanceof UIElement ||
                widget instanceof ScreenUIElement ||
                widget instanceof Widget
        );
        if (widget instanceof Widget) {
            WidgetFactory.verifyNotParented(widget);
        }

        // Store the WidgetFactory call source.
        while (widget._alloc.length > 3) {
            widget._alloc.pop();
        }
        const stack = new Error().stack
            .split("\n")
            .slice(3)
            .map((s) => s.replace(/.*\/Scripts\//, ""))
            .map((s) => s.replace(/:[0-9]*[)]?$/, ""));
        const entry = stack.slice(0, Math.min(stack.length, 3)).join(" + ");
        widget._alloc.unshift(entry);

        return widget;
    }
}

// ----------------------------------------------------------------------------

const _inventory = {
    border: new WidgetInventoryEntry(() => new Border()),
    button: new WidgetInventoryEntry(() => new Button()),
    canvas: new WidgetInventoryEntry(() => new Canvas()),
    checkBox: new WidgetInventoryEntry(() => new CheckBox()),
    horizontalBox: new WidgetInventoryEntry(() => new HorizontalBox()),
    imageButton: new WidgetInventoryEntry(() => new ImageButton()),
    imageWidget: new WidgetInventoryEntry(() => new ImageWidget()),
    layoutBox: new WidgetInventoryEntry(() => new LayoutBox()),
    multilineTextBox: new WidgetInventoryEntry(() => new MultilineTextBox()),
    slider: new WidgetInventoryEntry(() => new Slider()),
    text: new WidgetInventoryEntry(() => new Text()),
    textBox: new WidgetInventoryEntry(() => new TextBox()),
    verticalBox: new WidgetInventoryEntry(() => new VerticalBox()),
    uiElement: new WidgetInventoryEntry(() => new UIElement()),
    screenUIElement: new WidgetInventoryEntry(() => new ScreenUIElement()),
};

// ----------------------------------------------------------------------------

const _dummyWidgetBecauseUIElementWidgetUndefinedFails = new Widget();

/**
 * There are two related TTPG/Unreal bugs causing issues with UI Widgets.
 *
 * 1. reference counting isn't releasing them in multiplayer games, so
 * creating and releasing them often leaks and slows things down.
 *
 * 2. a bug with MulticastDelegate in the proxy object is keeping old
 * onClicked (for instance) handlers despite calling clear.  This appears
 * to happen when garbage collecing the JavaScript object while the
 * widget is still being used by a widget, and later retrieved by creating
 * a new proxy object.
 *
 * This attempts to workaround both by:
 *
 * 1. Keeping a free list and re-allocating those existing Widgets rather
 * than creating a new one.
 *
 * 2. Keeping an active list for in-use objects so the JavaScript object
 * cannot be garbage collected.
 *
 * If and when the underlying bugs are fixed disable by `RECYCLE = false`.
 */
class WidgetFactory {
    static auditActive() {
        let result = [];
        for (const [widgetName, widgetInventoryEntry] of Object.entries(
            _inventory
        )) {
            const allocToCount = {};
            for (const entry of widgetInventoryEntry._active) {
                if (entry._alloc && entry._alloc.length > 0) {
                    const caller = entry._alloc[0];
                    allocToCount[caller] = (allocToCount[caller] || 0) + 1;
                }
            }
            for (const [alloc, count] of Object.entries(allocToCount)) {
                result.push({ widgetName, alloc, count });
            }
        }
        result.sort((a, b) => {
            return a.count - b.count; // sorty by increasing count
        });
        result = result
            .map((entry) => `${entry.count} ${entry.widgetName} ${entry.alloc}`)
            .join("\n");
        return result;
    }

    static verifyNotParented(widget, path = []) {
        assert(!widget || widget instanceof Widget);

        if (!widget) {
            return;
        }

        const className = widget.constructor.name;
        path.push(className);

        if (widget.getParent()) {
            throw new Error(
                [
                    "[[[",
                    `WIDGET ALREADY PARENTED: ${path.join(".")}`,
                    ...widget._alloc,
                    "]]]",
                ].join("\n\n")
            );
        }
    }

    static removeAllChildren(widget) {
        assert(widget instanceof Panel || widget instanceof Canvas);

        const children = [];
        if (widget instanceof Panel) {
            for (let i = 0; i < 1000; i++) {
                const child = widget.getChildAt(i);
                if (child) {
                    children.push(child);
                } else {
                    break;
                }
            }
            widget.removeAllChildren();
        } else if (widget instanceof Canvas) {
            for (const child of widget.getChildren()) {
                widget.removeChild(child);
                children.push(child);
            }
        }

        for (const child of children) {
            WidgetFactory.release(child);
        }
    }

    static setChild(widget, child) {
        assert(widget instanceof Border || widget instanceof LayoutBox);
        assert(child === undefined || child instanceof Widget);

        const old = widget.getChild();
        widget.setChild(child);

        if (old) {
            WidgetFactory.release(old);
        }
    }

    /**
     * Release a widget, if this widget contains others release those too.
     *
     * @param {Widget|UIElement} widget
     * @returns {WidgetFactory} self, for chaining
     */
    static release(widget) {
        assert(
            widget instanceof UIElement ||
                widget instanceof ScreenUIElement ||
                widget instanceof Widget
        );

        if (!RECYCLE || !widget._isWidgetFactory) {
            return;
        }

        if (widget.__noMonkey) {
            delete widget.__noMonkey;
        }

        // If releasing UI release any connected widget.
        if (widget instanceof UIElement) {
            const ui = widget;
            widget = ui.widget;
            ui.widget = _dummyWidgetBecauseUIElementWidgetUndefinedFails;
            ui.anchorX = 0.5;
            ui.anchorY = 0.5;
            ui.height = 90;
            ui.players = undefined;
            ui.position = new Vector(0, 0, 0);
            ui.presentationStyle = 0;
            ui.rotation = new Rotator(0, 0, 0);
            ui.scale = 1;
            ui.twoSided = false;
            ui.useTransparency = false;
            ui.useWidgetSize = true;
            ui.width = 160;
            _inventory.uiElement.push(ui);
            WidgetFactory.release(widget);
            return;
        }
        if (widget instanceof ScreenUIElement) {
            const ui = widget;
            widget = ui.widget;
            ui.widget = _dummyWidgetBecauseUIElementWidgetUndefinedFails;
            ui.anchorX = 0;
            ui.anchorY = 0;
            ui.height = 90;
            ui.players = undefined;
            ui.positionX = 0;
            ui.positionY = 0;
            ui.relativeHeight = false;
            ui.relativePositionX = true;
            ui.reliatvePositionY = true;
            ui.relativeWidth = false;
            ui.width = 160;
            _inventory.screenUIElement.push(ui);
            WidgetFactory.release(widget);
            return;
        }

        assert(widget instanceof Widget);
        assert(!widget.getParent());
        assert(!widget.getOwningObject());

        // Reset some abstract class state.
        widget.setEnabled(true);
        widget.setVisible(true);

        if (widget instanceof TextWidgetBase) {
            widget.setFont("", refPackageId);
            widget.setFontSize(12);
            widget.setTextColor([1, 1, 1, 1]);
            widget.setBold(false);
            widget.setItalic(false);
        }
        if (widget instanceof Panel) {
            WidgetFactory.removeAllChildren(widget);
            widget.setChildDistance(0);
            widget.setHorizontalAlignment(HorizontalAlignment.Fill);
            widget.setVerticalAlignment(VerticalAlignment.Fill);
        }

        if (widget instanceof Border) {
            WidgetFactory.setChild(widget, undefined);
            widget.setColor([1, 0, 0, 1]);
            _inventory.border.push(widget);
        } else if (widget instanceof Button) {
            widget.onClicked.clear();
            widget.setText("");
            _inventory.button.push(widget);
        } else if (widget instanceof Canvas) {
            WidgetFactory.removeAllChildren(widget);
            _inventory.canvas.push(widget);
        } else if (widget instanceof CheckBox) {
            widget.onCheckStateChanged.clear();
            widget.setText("");
            widget.setIsChecked(false);
            _inventory.checkBox.push(widget);
        } else if (widget instanceof HorizontalBox) {
            _inventory.horizontalBox.push(widget);
        } else if (widget instanceof ImageButton) {
            widget.onClicked.clear();
            widget.onImageLoaded.clear();
            widget.setImage("global/ui/white16x16.png", refPackageId);
            widget.setImageSize(0, 0);
            widget.setTintColor([1, 1, 1, 1]);
            _inventory.imageButton.push(widget);
        } else if (widget instanceof ImageWidget) {
            widget.onImageLoaded.clear();
            widget.setImage("global/ui/white16x16.png", refPackageId);
            widget.setImageSize(0, 0);
            widget.setTintColor([1, 1, 1, 1]);
            _inventory.imageWidget.push(widget);
        } else if (widget instanceof LayoutBox) {
            WidgetFactory.setChild(widget, undefined);
            widget.setHorizontalAlignment(HorizontalAlignment.Fill);
            widget.setMaximumHeight(-1);
            widget.setMinimumWidth(-1);
            widget.setMaximumWidth(-1);
            widget.setOverrideHeight(-1);
            widget.setOverrideWidth(-1);
            widget.setPadding(0, 0, 0, 0);
            widget.setVerticalAlignment(VerticalAlignment.Fill);
            _inventory.layoutBox.push(widget);
        } else if (widget instanceof MultilineTextBox) {
            widget.setBackgroundTransparent(false);
            widget.setMaxLength(200);
            widget.setText("");
            _inventory.multilineTextBox.push(widget);
        } else if (widget instanceof Slider) {
            widget.onValueChanged.clear();
            widget.setMaxValue(1);
            widget.setMinValue(0);
            widget.setStepSize(0.01);
            widget.setTextBoxWidth(35);
            widget.setValue(0);
            _inventory.slider.push(widget);
        } else if (widget instanceof Text) {
            widget.setJustification(TextJustification.Left);
            widget.setText("");
            _inventory.text.push(widget);
        } else if (widget instanceof TextBox) {
            widget.onTextChanged.clear();
            widget.onTextCommitted.clear();
            widget.setBackgroundTransparent(false);
            widget.setInputType(0);
            widget.setMaxLength(100);
            widget.setSelectTextOnFocus(false);
            widget.setText("");
            _inventory.textBox.push(widget);
        } else if (widget instanceof VerticalBox) {
            _inventory.verticalBox.push(widget);
        }

        return this;
    }

    static border() {
        const widget = _inventory.border.popOrCreate();
        assert(!widget.getChild());
        return widget;
    }

    static button() {
        return _inventory.button.popOrCreate();
    }

    static canvas() {
        return _inventory.canvas.popOrCreate();
    }

    static checkBox() {
        return _inventory.checkBox.popOrCreate();
    }

    static horizontalBox() {
        return _inventory.horizontalBox.popOrCreate();
    }

    static imageButton() {
        return _inventory.imageButton.popOrCreate();
    }

    static imageWidget() {
        return _inventory.imageWidget.popOrCreate();
    }

    static layoutBox() {
        const widget = _inventory.layoutBox.popOrCreate();
        assert(!widget.getChild());
        return widget;
    }

    static multilineTextBox() {
        return _inventory.multilineTextBox.popOrCreate();
    }

    static screenUIElement() {
        return _inventory.screenUIElement.popOrCreate();
    }

    static slider() {
        return _inventory.slider.popOrCreate();
    }

    static text() {
        return _inventory.text.popOrCreate();
    }

    static textBox() {
        return _inventory.textBox.popOrCreate();
    }

    static verticalBox() {
        return _inventory.verticalBox.popOrCreate();
    }

    static uiElement() {
        const uiElement = _inventory.uiElement.popOrCreate();
        return uiElement;
    }
}

globalEvents.onObjectDestroyed.add((object) => {
    for (const ui of object.getUIs()) {
        object.removeUIElement(ui);
        WidgetFactory.release(ui);
    }
});

// Attach a function a player can call from the console window.
world._auditWidgets = () => {
    return WidgetFactory.auditActive();
};

module.exports = { WidgetFactory };
