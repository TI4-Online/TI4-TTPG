const assert = require("../../../wrapper/assert-wrapper");
const {
    Border,
    Canvas,
    Color,
    HorizontalAlignment,
    LayoutBox,
    Text,
    TextJustification,
    VerticalAlignment,
} = require("../../../wrapper/api");
const locale = require("../../locale");

class SeatTokenUI {
    constructor(canvas, canvasOffset, size) {
        assert(canvas instanceof Canvas);
        assert(typeof canvasOffset.x === "number");
        assert(typeof canvasOffset.y === "number");
        assert(typeof size.w === "number");
        assert(typeof size.h === "number");

        this._speakerFontSize = Math.min(255, Math.floor(size.h * 0.15));
        this._otherFontSize = Math.min(255, Math.floor(size.h * 2.6));

        this._bg = new Border().setColor(new Color(1, 1, 1));
        canvas.addChild(
            this._bg,
            canvasOffset.x,
            canvasOffset.y,
            size.w,
            size.h
        );

        this._label = new Text()
            .setFontSize(this._speakerFontSize)
            .setJustification(TextJustification.Center);
        const textBox = new LayoutBox()
            .setHorizontalAlignment(HorizontalAlignment.Center)
            .setVerticalAlignment(VerticalAlignment.Center)
            .setChild(new Border().setChild(this._label));
        canvas.addChild(
            textBox,
            canvasOffset.x,
            canvasOffset.y,
            size.w,
            size.h
        );
    }

    setColor(color) {}

    setSeatIndex(seatIndex) {
        assert(typeof seatIndex === "number");

        let fontSize;
        let label;
        if (seatIndex === 0) {
            label = locale("ui.label.speaker");
            fontSize = this._speakerFontSize;
        } else {
            label = " " + (seatIndex + 1).toString() + " ";
            fontSize = this._otherFontSize;
        }
        this._label.setFontSize(fontSize);
        this._label.setText(label);
    }
}

module.exports = { SeatTokenUI };
