const assert = require("../../../wrapper/assert-wrapper");
const { ColorUtil } = require("../../color/color-util");
const {
    HorizontalAlignment,
    LayoutBox,
    Text,
    TextJustification,
    VerticalAlignment,
} = require("../../../wrapper/api");

const BOX_W = 100;
const BOX_H = 30;
const FONT_SIZE = 14;

class UiSeat {
    constructor() {
        this._label = "?";
        this._color = [1, 1, 1, 1];
        this._scale = 1;
    }

    setColor(color) {
        assert(ColorUtil.isColor(color));
        this._color = color;
        return this;
    }

    setLabel(label) {
        assert(typeof label === "string");
        this._label = label;
        return this;
    }

    setScale(scale) {
        assert(typeof scale === "number");
        this._scale = scale;
        return this;
    }

    /**
     * Get the UI size.
     *
     * @returns {Object.{w:number,h:number}}
     */
    getSize() {
        return {
            w: Math.ceil(BOX_W * this._scale),
            h: Math.ceil(BOX_H * this._scale),
            fontSize: Math.ceil(FONT_SIZE * this._scale),
        };
    }

    createWidget() {
        const size = this.getSize();

        const content = new Text()
            .setFontSize(size.fontSize)
            .setJustification(TextJustification.Center)
            .setTextColor(this._color)
            .setText(this._label.toUpperCase());

        const layoutBox = new LayoutBox()
            .setOverrideWidth(size.w)
            .setOverrideHeight(size.h)
            .setHorizontalAlignment(HorizontalAlignment.Center)
            .setVerticalAlignment(VerticalAlignment.Center)
            .setChild(content);

        return layoutBox;
    }

    drawToCanvas(canvas, offset = { x: 0, y: 0 }) {
        throw new Error("drawToCanvas not supported");
    }
}

module.exports = { UiSeat, BOX_W, BOX_H };
