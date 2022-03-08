const assert = require("../../../wrapper/assert-wrapper");
const { MiltyUtil, DEFAULT_WRAP_AT } = require("./milty-util");
const { TileToImage } = require("../../system/tile-to-image");
const {
    Border,
    Canvas,
    ImageWidget,
    Text,
    TextJustification,
    refPackageId,
} = require("../../../wrapper/api");

const DEFAULT_SLICE_SCALE = 20;
const TILE_W = 20;
const TILE_H = Math.floor((TILE_W * 3) / 2);
const FONT_SIZE = 4;

/**
 * Draw a milty slice as a UI Widget.
 */
class MiltySliceUI {
    static getSize(scale) {
        assert(typeof scale === "number" && scale >= 1);

        const tileW = Math.floor(TILE_W * scale);
        const tileH = Math.floor(TILE_H * scale);
        const w = Math.floor(tileW * 2.5);
        const h = Math.floor(tileH * 3);
        return [w, h];
    }

    constructor(canvas, canvasOffset, scale) {
        assert(canvas instanceof Canvas);
        assert(typeof canvasOffset.x === "number");
        assert(typeof canvasOffset.y === "number");
        assert(typeof scale === "number" && scale >= 1);

        // Tile positions in "tile size" space.
        let offsets = [
            { x: 0.75, y: 2 }, // HS, ADD FIRST TO DRAW ON BOTTOM
            { x: 0, y: 1.5 }, // left of home
            { x: 0.75, y: 1 }, // front of home
            { x: 1.5, y: 1.5 }, // right of home
            { x: 0, y: 0.5 }, // left equidistant
            { x: 0.75, y: 0 }, // front far
        ];

        // Translate tile positions to canvas offsets.
        const tileW = Math.floor(TILE_W * scale);
        const tileH = Math.floor(TILE_H * scale);
        offsets = offsets.map((offset) => {
            return {
                x: offset.x * tileW + canvasOffset.x,
                y: offset.y * tileH + canvasOffset.y,
            };
        });

        // Add home system behind other elements (drawn in order).
        const hsOffset = offsets.shift();
        this._homeSystemBorder = new Border();
        canvas.addChild(
            this._homeSystemBorder,
            hsOffset.x,
            hsOffset.y,
            tileW,
            tileH
        );

        // Create per-tile LayoutBox elements.
        this._tileImages = offsets.map((offset) => {
            const img = new ImageWidget().setImageSize(tileW, tileH);
            canvas.addChild(img, offset.x, offset.y, tileW, tileH);
            return img;
        });

        // Add label.
        const fontSize = Math.min(255, Math.floor(FONT_SIZE * scale));
        this._label = new Text()
            .setFontSize(fontSize)
            .setJustification(TextJustification.Center);

        const labelX = canvasOffset.x;
        const labelY = canvasOffset.y + tileH * 2.5;
        const labelW = tileW * 2.5;
        const labelH = tileH / 2;
        canvas.addChild(this._label, labelX, labelY, labelW, labelH);
    }

    setSlice(miltySlice) {
        assert(Array.isArray(miltySlice));
        assert(miltySlice.length === 5);

        for (let i = 0; i < 5; i++) {
            const tile = miltySlice[i];
            const imgPath = TileToImage.tileToImage(tile);
            const image = this._tileImages[i];
            image.setImage(imgPath, refPackageId);
        }
        return this;
    }

    setColor(color) {
        assert(typeof color.r === "number");
        this._homeSystemBorder.setColor(color);
        return this;
    }

    setLabel(label) {
        assert(typeof label === "string");
        label = MiltyUtil.wrapSliceLabel(label, DEFAULT_WRAP_AT);
        this._label.setText(label);
        return this;
    }
}

module.exports = { MiltySliceUI, DEFAULT_SLICE_SCALE };
