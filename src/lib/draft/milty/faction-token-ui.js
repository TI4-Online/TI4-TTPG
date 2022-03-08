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
    constructor(canvas, canvasOffset, size) {
        assert(canvas instanceof Canvas);
        assert(typeof canvasOffset.x === "number");
        assert(typeof canvasOffset.y === "number");
        assert(typeof size.w === "number");
        assert(typeof size.h === "number");

        const fontSize = Math.floor(size.h * 0.1);
        const d = Math.min(size.w, size.h) - fontSize;
        this._image = new ImageWidget().setImageSize(d, d);

        const dx = (size.w - d) / 2;
        const dy = (size.h - d) / 2 - fontSize / 2;
        canvas.addChild(
            this._image,
            canvasOffset.x + dx,
            canvasOffset.y + dy,
            d,
            d
        );

        this._label = new Text()
            .setFontSize(size.h * 0.1)
            .setJustification(TextJustification.Center)
            .setText("XXX");
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
        this._image.setImage(path, refPackageId);

        this._label.setText(faction.nameAbbr);
    }
}

module.exports = { FactionTokenUI };
