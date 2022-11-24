const assert = require("../../wrapper/assert-wrapper");
const { ColorUtil } = require("../color/color-util");
const { Widget } = require("../../wrapper/api");
const { WidgetFactory } = require("../ui/widget-factory");

/**
 * Wrap child inside a padded box.
 */
class DraftSelectionWidget {
    /**
     * Return the DraftSelectionWidget in the ancestry.
     * WARNING: Button appears to forget parent sometimes!
     *
     * @param {Widget} widget
     * @returns {DraftSelectionWidget|undefined}
     */
    static getDraftSelectionWidgetAncestor(widget) {
        assert(widget instanceof Widget);
        while (widget) {
            console.log(`considering`);
            if (widget instanceof DraftSelectionWidget) {
                return widget;
            }
            widget = widget.getParent();
        }
    }

    constructor() {
        this._layoutBox = WidgetFactory.layoutBox();
        this._border = WidgetFactory.border().setChild(this._layoutBox);

        this.setBorderSize(1);
        this.clearSelection();
    }

    getWidget() {
        return this._border;
    }

    setBorderSize(padding) {
        assert(typeof padding === "number");
        const p = padding;
        this._layoutBox.setPadding(p, p, p, p);
        return this;
    }

    setChild(widget) {
        assert(widget instanceof Widget);
        this._layoutBox.setChild(widget);
        return this;
    }

    setSelection(color) {
        assert(ColorUtil.isColor(color));
        this._border.setColor(color);
        return this;
    }

    clearSelection() {
        const c = 0;
        this._border.setColor([c, c, c, 1]);
        return this;
    }
}

module.exports = { DraftSelectionWidget };
