const assert = require("../../wrapper/assert-wrapper");
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
    Slider,
    Text,
    TextBox,
    TextJustification,
    TextWidgetBase,
    Vector,
    VerticalAlignment,
    VerticalBox,
    Widget,
    UIElement,
    refPackageId,
} = require("../../wrapper/api");

const RECYCLE = true;
const INVENTORY_CAP = 600;

const _inventory = {
    border: [],
    button: [],
    canvas: [],
    checkBox: [],
    horizontalBox: [],
    imageButton: [],
    imageWidget: [],
    layoutBox: [],
    multilineTextBox: [],
    placeHolder: [],
    slider: [],
    text: [],
    textBox: [],
    verticalBox: [],
    uiElement: [],
};

class PlaceHolder extends Widget {
    constructor() {
        super();
    }
}

class WidgetFactory {
    /**
     * Release a widget, if this widget contains others release those too.
     *
     * @param {Widget|UIElement} widget
     * @returns {WidgetFactory} self, for chaining
     */
    static release(widget, isRecursiveCall) {
        if (!RECYCLE) {
            return;
        }

        // Watch out for double-release.
        if (widget._isReleased) {
            return;
        }
        widget._isReleased = true;

        // If releasing UI release any connected widget.
        if (widget instanceof UIElement) {
            const ui = widget;
            widget = ui.widget;
            ui.widget = undefined;
            WidgetFactory.release(widget);
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
            return;
        }

        assert(widget instanceof Widget);

        assert(!widget.getParent());
        assert(!widget.getOwningObject());

        // Reset some abstract class state.
        if (widget instanceof TextWidgetBase) {
            widget.setFont("", refPackageId);
            widget.setFontSize(12);
            widget.setTextColor([1, 1, 1, 1]);
            widget.setBold(false);
            widget.setItalic(false);
        }
        if (widget instanceof Panel) {
            const children = [];
            for (let i = 0; i < 100; i++) {
                const child = widget.getChildAt(i);
                if (child) {
                    children.push(child);
                } else {
                    break;
                }
            }
            widget.removeAllChildren();
            widget.setChildDistance(0);
            widget.setHorizontalAlignment(HorizontalAlignment.Fill);
            widget.setVerticalAlignment(VerticalAlignment.Fill);
            for (const child of children) {
                WidgetFactory.release(child, true);
            }
        }

        if (widget instanceof Border) {
            const child = widget.getChild();
            widget.setChild(WidgetFactory._placeholder());
            widget.setColor([1, 0, 0, 1]);
            _inventory.border.push(widget);
            if (child) {
                WidgetFactory.release(child, true);
            }
        } else if (widget instanceof Button) {
            widget.onClicked.clear();
            widget.setText("");
            _inventory.button.push(widget);
        } else if (widget instanceof Canvas) {
            const children = widget.getChildren();
            for (const child of children) {
                widget.removeChild(child);
                WidgetFactory.release(child, true);
            }
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
            const child = widget.getChild();
            widget.setChild(WidgetFactory._placeholder());
            widget.setHorizontalAlignment(HorizontalAlignment.Fill);
            widget.setMaximumHeight(-1);
            widget.setMinimumWidth(-1);
            widget.setMaximumWidth(-1);
            widget.setOverrideHeight(-1);
            widget.setOverrideWidth(-1);
            widget.setPadding(0, 0, 0, 0);
            widget.setVerticalAlignment(VerticalAlignment.Fill);
            _inventory.layoutBox.push(widget);
            if (child) {
                WidgetFactory.release(child, true);
            }
        } else if (widget instanceof MultilineTextBox) {
            widget.setBackgroundTransparent(false);
            widget.setMaxLength(200);
            widget.setText("");
            _inventory.multilineTextBox.push(widget);
        } else if (widget instanceof Slider) {
            widget.onValueChanged.clear();
            widget.setMaxValue(1);
            widget.setMinValue(1);
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

        // If alloc/release are not balanced inventory could go out of control.
        // Trim to a reasonable level.
        if (!isRecursiveCall) {
            for (const inventory of Object.values(_inventory)) {
                const excess = INVENTORY_CAP - inventory.length;
                if (excess > 0) {
                    inventory.slice(INVENTORY_CAP);
                }
            }
        }

        return this;
    }

    static border() {
        const widget = WidgetFactory._alloc(_inventory.border);
        if (widget) {
            const child = widget.getChild();
            if (child && child instanceof PlaceHolder) {
                _inventory.placeHolder.push(child);
            }
        }
        return widget ? widget : new Border();
    }

    static button() {
        const widget = WidgetFactory._alloc(_inventory.button);
        return widget ? widget : new Button();
    }

    static canvas() {
        const widget = WidgetFactory._alloc(_inventory.canvas);
        return widget ? widget : new Canvas();
    }

    static checkBox() {
        const widget = WidgetFactory._alloc(_inventory.checkBox);
        return widget ? widget : new CheckBox();
    }

    static horizontalBox() {
        const widget = WidgetFactory._alloc(_inventory.horizontalBox);
        return widget ? widget : new HorizontalBox();
    }

    static imageButton() {
        const widget = WidgetFactory._alloc(_inventory.imageButton);
        return widget ? widget : new ImageButton();
    }

    static imageWidget() {
        const widget = WidgetFactory._alloc(_inventory.imageWidget);
        return widget ? widget : new ImageWidget();
    }

    static layoutBox() {
        const widget = WidgetFactory._alloc(_inventory.layoutBox);
        if (widget) {
            const child = widget.getChild();
            if (child && child instanceof PlaceHolder) {
                _inventory.placeHolder.push(child);
            }
        }
        return widget ? widget : new LayoutBox();
    }

    static multilineTextBox() {
        const widget = WidgetFactory._alloc(_inventory.multilineTextBox);
        return widget ? widget : new MultilineTextBox();
    }

    static slider() {
        const widget = WidgetFactory._alloc(_inventory.slider);
        return widget ? widget : new Slider();
    }

    static text() {
        const widget = WidgetFactory._alloc(_inventory.text);
        return widget ? widget : new Text();
    }

    static textBox() {
        const widget = WidgetFactory._alloc(_inventory.textBox);
        return widget ? widget : new TextBox();
    }

    static verticalBox() {
        const widget = WidgetFactory._alloc(_inventory.verticalBox);
        return widget ? widget : new VerticalBox();
    }

    static uiElement() {
        const widget = WidgetFactory._alloc(_inventory.uiElement);
        return widget ? widget : new UIElement();
    }

    /**
     * Some widgets cannot release their child withough replacing it.
     * Return a "cheap" widget to take the slot.
     *
     * @returns {Widget}
     */
    static _placeholder() {
        // Placeholders live in "cannot clear child" widgets, expecting the
        // widget consumer will replace them.  It is possible they will not,
        // at least not immediately.  Check that a placeholder is free.
        while (_inventory.placeHolder.length > 0) {
            const widget = _inventory.placeHolder.pop();
            if (!widget.getParent()) {
                return widget;
            }
            // Otherwise this widget is still linked to another.  Forget it.
        }
        return new PlaceHolder();
    }

    static _alloc(inventoryArray) {
        assert(Array.isArray(inventoryArray));
        const widget = inventoryArray.pop();
        if (widget) {
            if (widget instanceof Widget) {
                assert(!widget.getParent());
            }
            assert(widget._isReleased);
            widget._isReleased = false;
        }
        return widget;
    }
}

module.exports = { WidgetFactory };
