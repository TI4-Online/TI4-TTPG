const assert = require("../../../wrapper/assert-wrapper");
const { ColorUtil } = require("../../color/color-util");
const { Hex } = require("../../hex");
const { System } = require("../../system/system");
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
const { AbstractUtil } = require("./abstract-util");

const TILE_W = 50;
const FONT_SCALE = 0.08;

class UiSlice {
    /**
     * Constructor.
     */
    constructor() {
        this._homeSystemcolor = [1, 1, 1, 1];
        this._label = "Slice";
        this._scale = 1;
        this._shape = undefined;
        this._slice = undefined;
    }

    setHomeSystemColor(color) {
        assert(ColorUtil.isColor(color));
        this._homeSystemcolor = color;
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
     * Set the slice shape.
     *
     * @param {Array.{string}} shape - list of hexes with slice pointing north, home is first entry then in slice order
     * @returns {UiSlice} self, for chaining
     */
    setShape(shape) {
        AbstractUtil.assertIsShape(shape);
        this._shape = [...shape]; // shallow copy
        return this;
    }

    setSlice(slice) {
        AbstractUtil.assertIsSlice(slice, this._shape);
        this._slice = [...slice]; // shallow copy
        return this;
    }

    /**
     * Get the UI size, also fills in per-tile positions as a side effect.
     *
     * @returns {Object.{w:number,h:number,tileW:number,tileH:number,positions:Array.{x:number,y:number}}}
     */
    getSize() {
        if (!this._shape) {
            throw new Error("must call setShape first");
        }

        const scale = (TILE_W / (Hex.HALF_SIZE * 2)) * this._scale;
        const halfW = Math.ceil(Hex.HALF_SIZE * scale);
        const halfH = Math.ceil(halfW * 0.866);

        // Get the bounding box and scaled positions.
        const bb = {
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
        };
        const positions = [];
        for (const hex of this._shape) {
            const pos = Hex.toPosition(hex);
            [pos.x, pos.y] = [pos.y, -pos.x]; // TTPG x/y are reversed, "Y" inverted
            pos.x = Math.floor(pos.x * scale);
            pos.y = Math.floor(pos.y * scale);
            positions.push(pos);
            if (pos.x - halfW < bb.left) {
                bb.left = pos.x - halfW;
            }
            if (pos.x + halfW > bb.right) {
                bb.right = pos.x + halfW;
            }
            if (pos.y - halfH < bb.top) {
                bb.top = pos.y - halfH;
            }
            if (pos.y + halfH > bb.bottom) {
                bb.bottom = pos.y + halfH;
            }
        }

        // Adjust positions to be relative to top-left.
        for (const pos of positions) {
            pos.x = pos.x - bb.left;
            pos.y = pos.y - bb.top;
        }

        return {
            w: Math.ceil(bb.right - bb.left + this._scale), // renders slightly wider than bb
            h: Math.ceil(bb.bottom - bb.top),
            halfW,
            halfH,
            tileW: halfW * 2,
            tileH: halfH * 2,
            fontSize: Math.ceil(halfW * 2 * FONT_SCALE),
            positions,
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

        if (!this._shape) {
            throw new Error("must call setSlice first");
        }

        const size = this.getSize();

        // Draw home system marker.
        let pos = size.positions[0];
        const image = new ImageWidget()
            .setImage("global/ui/tiles/blank.png", refPackageId)
            .setTintColor(this._homeSystemcolor);
        const d = 0;
        canvas.addChild(
            image,
            offset.x + pos.x - size.halfW - d,
            offset.y + pos.y - size.halfW - d, // image is square
            size.tileW + d * 2,
            size.tileW + d * 2
        );

        // Draw systems.
        this._slice.forEach((tile, index) => {
            const pos = size.positions[index + 1]; // first is home
            assert(pos);

            const system = world.TI4.getSystemByTileNumber(tile);
            assert(system);

            const imgPath = system.raw.img;
            const packageId = system.raw.packageId
                ? system.raw.packageId
                : refPackageId;
            const image = new ImageWidget().setImage(imgPath, packageId);

            canvas.addChild(
                image,
                offset.x + pos.x - size.halfW - 1,
                offset.y + pos.y - size.halfW - 1, // image is square
                size.tileW + 2,
                size.tileW + 2
            );
        });

        // Draw label.
        pos = size.positions[0];
        const includeOptimal = true;
        const summary = System.summarize(this._slice, includeOptimal);
        const label = `${summary}\n${this._label}`;
        const text = new Text()
            .setAutoWrap(true)
            .setBold(true)
            .setJustification(TextJustification.Center)
            .setFontSize(size.fontSize)
            .setTextColor([0, 0, 0, 1])
            .setText(label);

        const textBox = new LayoutBox()
            .setOverrideWidth(size.tileW)
            .setOverrideHeight(size.tileH)
            .setVerticalAlignment(VerticalAlignment.TOP)
            .setChild(text);

        canvas.addChild(
            textBox,
            offset.x + pos.x - size.halfW,
            offset.y + pos.y - size.fontSize,
            size.tileW,
            size.halfH
        );
    }
}

module.exports = { UiSlice, TILE_W };
