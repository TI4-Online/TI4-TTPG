const assert = require("../../../wrapper/assert-wrapper");
const { MiltyUtil, DEFAULT_WRAP_AT } = require("./milty-util");
const { TileToImage } = require("../../system/tile-to-image");
const {
    Border,
    Button,
    Canvas,
    ImageWidget,
    LayoutBox,
    refPackageId,
} = require("../../../wrapper/api");
const { DraftSelectionWidget } = require("../draft-selection-widget");

const DEFAULT_SLICE_SCALE = 10;
const TILE_W = 30;
const TILE_H = TILE_W * 0.866;
const FONT_SIZE = 4;

/**
 * Draw a milty slice as a UI Widget.
 */
class MiltySliceUI {
    static getSize(scale) {
        assert(typeof scale === "number" && scale >= 1);

        const tileW = Math.floor(TILE_W * scale);
        const tileH = Math.floor(TILE_H * scale);
        const sliceW = Math.floor(tileW * 2.5);
        const sliceH = Math.floor(tileH * 3.75);
        return { sliceW, sliceH, tileW, tileH };
    }

    static getFontSize(scale) {
        return Math.min(255, Math.floor(FONT_SIZE * scale));
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

        // Images are square with some transparency at the top/bottom.
        const dH = (tileW - tileH) / 2;

        offsets = offsets.map((offset) => {
            return {
                x: offset.x * tileW + canvasOffset.x,
                y: offset.y * tileH + canvasOffset.y - dH,
            };
        });

        // Add home system behind other elements (drawn in order).
        this._tileBoxes = offsets.map((offset) => {
            const layoutBox = new LayoutBox();
            canvas.addChild(
                layoutBox,
                offset.x - 1,
                offset.y - 1,
                tileW + 2,
                tileW + 2 // use W for H because image is square with transparent top/bottom
            );
            return layoutBox;
        });
        this._homeSystemBox = this._tileBoxes.shift();

        // Label / button area.
        this._labelFontSize = MiltySliceUI.getFontSize(scale);
        this._labelBox = new LayoutBox();
        const labelX = canvasOffset.x;
        const labelY = canvasOffset.y + tileH * 2.75;
        const labelW = tileW * 2.5;
        const labelH = tileH;
        canvas.addChild(this._labelBox, labelX, labelY, labelW, labelH);
    }

    setSlice(miltySlice) {
        assert(Array.isArray(miltySlice));
        assert(miltySlice.length === 5);

        for (let i = 0; i < 5; i++) {
            const tile = miltySlice[i];
            const imgPath = TileToImage.tileToImage(tile);
            const tileBox = this._tileBoxes[i];
            tileBox.setChild(new ImageWidget().setImage(imgPath, refPackageId));
        }
        return this;
    }

    setColor(color) {
        assert(typeof color.r === "number");
        this._homeSystemBox.setChild(new Border().setColor(color));
        return this;
    }

    setLabel(label, onClickedGenerator) {
        assert(typeof label === "string");
        assert(typeof onClickedGenerator === "function");

        label = MiltyUtil.wrapSliceLabel(label, DEFAULT_WRAP_AT);
        const button = new Button()
            .setFontSize(this._labelFontSize)
            .setText(label);
        const draftSelection = new DraftSelectionWidget().setChild(button);
        button.onClicked.add(onClickedGenerator(draftSelection));
        this._labelBox.setChild(draftSelection);
        return this;
    }

    clear() {
        for (let i = 0; i < 5; i++) {
            const tileBox = this._tileBoxes[i];
            tileBox.setChild();
        }
        this._homeSystemBox.setChild();
        this._labelBox.setChild();
    }
}

module.exports = { MiltySliceUI, DEFAULT_SLICE_SCALE };
