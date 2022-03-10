const locale = require("../../locale");
const { ColorUtil } = require("../../color/color-util");
const assert = require("../../../wrapper/assert-wrapper");
const { DraftSelectionWidget } = require("../draft-selection-widget");
const {
    Border,
    Button,
    Canvas,
    Color,
    LayoutBox,
    world,
} = require("../../../wrapper/api");

class SeatTokenUI {
    static getSeatDataArray(speakerIndex) {
        assert(typeof speakerIndex === "number");
        const result = [];

        const playerCount = world.TI4.config.playerCount;
        if (speakerIndex === -1) {
            speakerIndex = Math.floor(Math.random() * playerCount);
        }

        assert(speakerIndex < playerCount);

        for (let i = 0; i < playerCount; i++) {
            let orderIndex = i - speakerIndex;
            if (orderIndex < 0) {
                orderIndex += playerCount;
            }
            result.push({
                orderIndex,
                deskIndex: i,
            });
        }

        return result;
    }

    constructor(canvas, canvasOffset, size) {
        assert(canvas instanceof Canvas);
        assert(typeof canvasOffset.x === "number");
        assert(typeof canvasOffset.y === "number");
        assert(typeof size.w === "number");
        assert(typeof size.h === "number");

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

    setSeatIndex(orderIndex, onClickedGenerator) {
        assert(typeof orderIndex === "number");
        assert(typeof onClickedGenerator === "function");

        let label;
        if (orderIndex === 0) {
            label = locale("ui.label.speaker");
        } else {
            label = (orderIndex + 1).toString();
        }
        const button = new Button().setFontSize(this._fontSize).setText(label);
        const draftSelection = new DraftSelectionWidget().setChild(button);
        button.onClicked.add(onClickedGenerator(draftSelection));
        this._labelBox.setChild(draftSelection);
    }
}

module.exports = { SeatTokenUI };
