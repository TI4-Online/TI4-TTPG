const assert = require("../../../wrapper/assert-wrapper");
const {
    Canvas,
    ImageWidget,
    LayoutBox,
    Text,
    TextJustification,
    VerticalAlignment,
    refPackageId,
    world,
} = require("../../../wrapper/api");

class FactionTokenUI {
    constructor(canvas, canvasOffset, size, fontSize) {
        assert(canvas instanceof Canvas);
        assert(typeof canvasOffset.x === "number");
        assert(typeof canvasOffset.y === "number");
        assert(typeof size.w === "number");
        assert(typeof size.h === "number");
        assert(typeof fontSize === "number");

        const d = Math.min(size.w, size.h) - fontSize;
        this._imageBox = new LayoutBox()
            .setOverrideWidth(d)
            .setOverrideHeight(d);

        const dx = (size.w - d) / 2;
        const dy = (size.h - d) / 2 - fontSize;
        canvas.addChild(
            this._imageBox,
            canvasOffset.x + dx,
            canvasOffset.y + dy,
            d,
            d
        );

        this._label = new Text()
            .setFontSize(fontSize)
            .setJustification(TextJustification.Center);
        const textBox = new LayoutBox()
            .setVerticalAlignment(VerticalAlignment.Bottom)
            .setChild(this._label);
        canvas.addChild(
            textBox,
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

        const path = `global/factions/${factionNsidName}_icon.png`;
        this._imageBox.setChild(new ImageWidget().setImage(path, refPackageId));
        this._label.setText(faction.nameAbbr);
    }

    clear() {
        this._imageBox.setChild();
        this._label.setText("");
    }
}

module.exports = { FactionTokenUI };
