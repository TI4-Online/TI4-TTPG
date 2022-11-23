const assert = require("../../wrapper/assert-wrapper");
const {
    Border,
    Button,
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

const _inventory = {
    border: [],
    button: [],
    checkBox: [],
    horizontalBox: [],
    imageButton: [],
    imageWidget: [],
    layoutBox: [],
    multilineTextBox: [],
    slider: [],
    text: [],
    textBox: [],
    verticalBox: [],
    uiElement: [],
};

class WidgetFactory {
    /**
     * Release a widget, if this widget contains others release those too.
     *
     * @param {Widget} widget
     * @returns {WidgetFactory} self, for chaining
     */
    static release(widget) {
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
        //assert(!widget.getOwningObject());

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
                WidgetFactory.release(child);
            }
        }

        if (widget instanceof Border) {
            const child = widget.getChild();
            widget.setChild(WidgetFactory._placeholder());
            widget.setColor([1, 0, 0, 1]);
            _inventory.border.push(widget);
            if (child) {
                WidgetFactory.release(child);
            }
        } else if (widget instanceof Button) {
            widget.onClicked.clear();
            widget.setText("");
            _inventory.button.push(widget);
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
            widget.setMaximumWidget(-1);
            widget.setMinimumWidth(-1);
            widget.setMaximumWidth(-1);
            widget.setOverrideHeight(-1);
            widget.setOverrideWidth(-1);
            widget.setPadding(0, 0, 0, 0);
            widget.setVerticalAlignment(VerticalAlignment.Fill);
            _inventory.layoutBox.push(widget);
            if (child) {
                WidgetFactory.release(child);
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

        return this;
    }

    static border() {
        const widget = _inventory.border.pop();
        return widget ? widget : new Border();
    }

    static button() {
        const widget = _inventory.button.pop();
        return widget ? widget : new Button();
    }

    static checkBox() {
        const widget = _inventory.checkBox.pop();
        return widget ? widget : new CheckBox();
    }

    static horizontalBox() {
        const widget = _inventory.horizontalBox.pop();
        return widget ? widget : new HorizontalBox();
    }

    static imageButton() {
        const widget = _inventory.imageButton.pop();
        return widget ? widget : new ImageButton();
    }

    static imageWidget() {
        const widget = _inventory.imageWidget.pop();
        return widget ? widget : new ImageWidget();
    }

    static layoutBox() {
        const widget = _inventory.layoutBox.pop();
        return widget ? widget : new LayoutBox();
    }

    static multilineTextBox() {
        const widget = _inventory.multilineTextBox.pop();
        return widget ? widget : new MultilineTextBox();
    }

    static slider() {
        const widget = _inventory.slider.pop();
        return widget ? widget : new Slider();
    }

    static text() {
        const widget = _inventory.text.pop();
        return widget ? widget : new Text();
    }

    static textBox() {
        const widget = _inventory.textBox.pop();
        return widget ? widget : new TextBox();
    }

    static verticalBox() {
        const widget = _inventory.verticalBox.pop();
        return widget ? widget : new VerticalBox();
    }

    static uiElement() {
        const widget = _inventory.uiElement.pop();
        return widget ? widget : new UIElement();
    }

    /**
     * Some widgets cannot release their child withough replacing it.
     * Return a "cheap" widget to take the slot.
     *
     * @returns {Widget}
     */
    static _placeholder() {
        return WidgetFactory.layoutBox();
    }
}

module.exports = { WidgetFactory };
