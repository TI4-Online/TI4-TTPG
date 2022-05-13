const locale = require("../../locale");
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
        assert(0 <= speakerIndex && speakerIndex < playerCount);

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

    setSeatIndex(deskIndex, orderIndex, onClickedGenerator) {
        assert(typeof deskIndex === "number");
        assert(typeof orderIndex === "number");
        assert(typeof onClickedGenerator === "function");

        const playerDesk = world.TI4.getAllPlayerDesks()[deskIndex];
        assert(playerDesk);
        let deskColor = playerDesk.colorName;
        deskColor =
            deskColor[0].toUpperCase() + deskColor.substring(1).toLowerCase();

        let label;
        if (orderIndex === 0) {
            label = locale("ui.label.speaker");
        } else {
            label = `${orderIndex + 1}: ${deskColor}`;
        }
        const button = new Button().setFontSize(this._fontSize).setText(label);
        const draftSelection = new DraftSelectionWidget().setChild(button);
        button.onClicked.add(onClickedGenerator(draftSelection));
        this._labelBox.setChild(draftSelection);
    }
}

module.exports = { SeatTokenUI };
