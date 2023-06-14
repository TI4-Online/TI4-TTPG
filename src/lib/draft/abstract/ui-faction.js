const assert = require("../../../wrapper/assert-wrapper");
const {
    Canvas,
    LayoutBox,
    ImageWidget,
    Text,
    TextJustification,
    refPackageId,
    world,
} = require("../../../wrapper/api");
const { AbstractUtil } = require("./abstract-util");

const BOX_W = 200;
const BOX_H = 100;
const FONT_SCALE = 0.2;

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
            fontSize: Math.ceil(BOX_H * FONT_SCALE * this._scale),
        };
    }

    createWidget() {
        const size = this.getSize();

        const canvas = new Canvas(size.w, size.h);

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
        const iconSize = Math.floor(size.h - size.fontSize * 1.8);

        let left = offset.x + (size.w - iconSize) / 2;
        let top = offset.y;
        canvas.addChild(icon, left, top, iconSize, iconSize);

        const label = new Text()
            .setFontSize(size.fontSize)
            .setJustification(TextJustification.Center)
            .setText(faction.nameAbbr);

        left = offset.x + 0;
        top = top + iconSize;
        canvas.addChild(label, left, top, size.w, size.h);
    }
}

module.exports = { UiFaction, BOX_W, BOX_H };
