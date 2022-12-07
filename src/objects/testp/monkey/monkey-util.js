const assert = require("../../wrapper/assert-wrapper");
const {
    Border,
    Button,
    Canvas,
    CheckBox,
    ImageButton,
    LayoutBox,
    Panel,
    UIElement,
    Widget,
    world,
} = require("../../wrapper/api");

class MonkeyUtil {
    static randomFrom(array) {
        assert(Array.isArray(array));
        const index = Math.floor(Math.random() * array.length);
        return array[index];
    }

    static getClickableGlobalWidgets() {
        return MonkeyUtil._getClickableWidgets(world.getUIs());
    }

    static getClickableObjectWidgets() {
        const candidates = [];
        for (const obj of world.getAllObjects()) {
            if (!obj.isValid()) {
                continue;
            }
            if (obj.getContainer()) {
                continue;
            }
            const b = MonkeyUtil._getClickableWidgets(obj.getUIs());
            candidates.push(...b);
        }
        return candidates;
    }

    /**
     * Find clickable widgets (Button, ImageButton, Checkbox) inside UI.
     * Widgets may have __noMonkey to avoid.
     *
     * @param {Array.{UIElement}} uiElements
     * @returns {Array.{Button|ImageButton|CheckBox}}
     */
    static _getClickableWidgets(uiElements) {
        assert(Array.isArray(uiElements));
        uiElements.forEach((uiElement) =>
            assert(uiElement instanceof UIElement)
        );

        const clickable = [];
        const consider = (widget) => {
            if (!widget) {
                return; // border can be empty, etc
            }
            assert(widget instanceof Widget);
            if (!widget.isEnabled() || !widget.isVisible()) {
                return;
            }
            if (widget.__noMonkey) {
                return;
            }
            if (
                widget instanceof Button ||
                widget instanceof ImageButton ||
                widget instanceof CheckBox
            ) {
                clickable.push(widget);
            } else if (
                widget instanceof Border ||
                widget instanceof LayoutBox
            ) {
                consider(widget.getChild());
            } else if (widget instanceof Panel) {
                for (let i = 0; widget.getChildAt(i); i++) {
                    consider(widget.getChildAt(i));
                }
            } else if (widget instanceof Canvas) {
                for (const child of widget.getChildren()) {
                    consider(child);
                }
            }
        };
        for (const uiElement of uiElements) {
            consider(uiElement.widget);
        }
        return clickable;
    }
}

module.exports = { MonkeyUtil };
