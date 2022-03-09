const assert = require("../../wrapper/assert-wrapper");
const { ColorUtil } = require("../color/color-util");
const { Border, LayoutBox, Widget } = require("../../wrapper/api");

const PADDING = 4;

/**
 * Wrap child inside a padded box.
 */
class DraftSelectionWidget extends Border {
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
        super();

        this._layoutBox = new LayoutBox();
        super.setChild(this._layoutBox);

        this.setBorderSize(PADDING);
        this.clearSelection();
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
        this.setColor(color);
        return this;
    }

    clearSelection() {
        const c = 0;
        this.setColor([c, c, c, 1]);
        return this;
    }
}

module.exports = { DraftSelectionWidget };
