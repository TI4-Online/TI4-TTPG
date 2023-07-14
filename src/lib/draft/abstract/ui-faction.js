const assert = require("../../../wrapper/assert-wrapper");
const { AbstractUtil } = require("./abstract-util");
const {
    Canvas,
    LayoutBox,
    HorizontalAlignment,
    HorizontalBox,
    ImageWidget,
    Text,
    TextJustification,
    VerticalAlignment,
    refPackageId,
    world,
} = require("../../../wrapper/api");

const BOX_W = 100;
const BOX_H = 30;
const FONT_SIZE = 8;

class UiFaction {
    constructor() {
        this._factionNsidName = undefined;
        this._scale = 1;
    }

    setFactionNsidName(factionNsidName) {
        AbstractUtil.assertIsFaction(factionNsidName);
        // Just keep the name, look it up again when needed (do not cache here).
        this._factionNsidName = factionNsidName;
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

        const canvas = new Canvas();

        const layoutBox = new LayoutBox()
            .setOverrideWidth(size.w)
            .setOverrideHeight(size.h)
            .setChild(canvas);

        this.drawToCanvas(canvas);

        return layoutBox;
    }

    drawToCanvas(canvas, offset = { x: 0, y: 0 }) {
        assert(canvas instanceof Canvas);
        assert(typeof offset.x === "number");
        assert(typeof offset.y === "number");

        const faction = world.TI4.getFactionByNsidName(this._factionNsidName);
        if (!faction) {
            throw new Error(`unknown faction "${this._factionNsidName}`);
        }

        const size = this.getSize();

        const imgPath = faction.icon;
        const packageId = faction.packageId ? faction.packageId : refPackageId;
        const icon = new ImageWidget().setImage(imgPath, packageId);

        const margin = Math.floor(size.h * 0.1);
        const iconSize = size.h - margin * 2;
        icon.setImageSize(iconSize, iconSize);

        const factionName = faction.nameAbbr.toUpperCase().replace(" - ", "\n");

        const label = new Text()
            .setFontSize(size.fontSize)
            .setText(factionName)
            .setJustification(TextJustification.Center);
        const labelBox = new LayoutBox()
            .setVerticalAlignment(VerticalAlignment.Center)
            .setChild(label);

        const content = new HorizontalBox()
            .setChildDistance(margin)
            .addChild(icon)
            .addChild(labelBox);

        const contentBox = new LayoutBox()
            .setHorizontalAlignment(HorizontalAlignment.Center)
            .setVerticalAlignment(VerticalAlignment.Center)
            .setChild(content);

        canvas.addChild(contentBox, 0, 0, size.w, size.h);
    }
}

module.exports = { UiFaction, BOX_W, BOX_H };
