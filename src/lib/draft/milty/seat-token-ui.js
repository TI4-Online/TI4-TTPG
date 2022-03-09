const assert = require("../../../wrapper/assert-wrapper");
const {
    Border,
    Button,
    Canvas,
    Color,
    LayoutBox,
} = require("../../../wrapper/api");
const locale = require("../../locale");
const { ColorUtil } = require("../../color/color-util");

class SeatTokenUI {
    constructor(canvas, canvasOffset, size) {
        assert(canvas instanceof Canvas);
        assert(typeof canvasOffset.x === "number");
        assert(typeof canvasOffset.y === "number");
        assert(typeof size.w === "number");
        assert(typeof size.h === "number");

        this._seatIndex = -1;
        this._fontSize = Math.min(255, Math.floor(size.h * 0.3));

        this._bg = new Border().setColor(new Color(1, 1, 1));
        canvas.addChild(
            this._bg,
            canvasOffset.x,
            canvasOffset.y,
            size.w,
            size.h
        );

        this._labelBox = new LayoutBox();
        canvas.addChild(
            this._labelBox,
            canvasOffset.x,
            canvasOffset.y,
            size.w,
            size.h
        );
    }

    setColor(color) {
        assert(ColorUtil.isColor(color));
        this._bg.setColor(color);
    }

    setSeatIndex(seatIndex) {
        assert(typeof seatIndex === "number");
        this._seatIndex = seatIndex;

        let label;
        if (seatIndex === 0) {
            label = locale("ui.label.speaker");
        } else {
            label = (seatIndex + 1).toString();
        }
        this._labelBox.setChild(
            new Button().setFontSize(this._fontSize).setText(label)
        );
    }
}

module.exports = { SeatTokenUI };
