const assert = require("../../../wrapper/assert-wrapper");
const { Button, Canvas, LayoutBox, world } = require("../../../wrapper/api");

class FactionTokenUI {
    constructor(canvas, canvasOffset, size) {
        assert(canvas instanceof Canvas);
        assert(typeof canvasOffset.x === "number");
        assert(typeof canvasOffset.y === "number");
        assert(typeof size.w === "number");
        assert(typeof size.h === "number");

        this._labelFontSize = Math.min(255, Math.floor(size.h * 0.3));
        this._labelBox = new LayoutBox();
        canvas.addChild(
            this._labelBox,
            canvasOffset.x,
            canvasOffset.y,
            size.w,
            size.h
        );
    }

    setFaction(factionNsidName) {
        assert(typeof factionNsidName === "string");

        const faction = world.TI4.getFactionByNsidName(factionNsidName);
        if (!faction) {
            throw new Error(`unknown faction "${factionNsidName}`);
        }

        this._labelBox.setChild(
            new Button()
                .setFontSize(this._labelFontSize)
                .setText(faction.nameAbbr)
        );
    }

    clear() {
        this._labelBox.setChild();
    }
}

module.exports = { FactionTokenUI };
