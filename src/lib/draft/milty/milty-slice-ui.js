const assert = require("../../../wrapper/assert-wrapper");
const { TileToImage } = require("../../system/tile-to-image");
const {
    Border,
    Canvas,
    ImageWidget,
    LayoutBox,
    Text,
    TextJustification,
    refPackageId,
} = require("../../../wrapper/api");
const DEFAULT_SLICE_SCALE = 20;
const TILE_W = 20;
const TILE_H = Math.floor((TILE_W * 3) / 2);
const FONT_SIZE = 4;
const WRAP_LABEL_AFTER = 20;

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

    static wrapLabel(label) {
        assert(typeof label === "string");

        // Adding to a string creates a different object.  Instead push
        // to a per-line token list.
        let currentLine = [];
        let currentLineLen = 0;

        const result = [currentLine];

        const tokens = label.split(" ");
        for (const token of tokens) {
            let delimLen = currentLineLen > 0 ? 1 : 0;
            const tokenLen = token.length;
            if (currentLineLen + delimLen + tokenLen > WRAP_LABEL_AFTER) {
                currentLine = [];
                currentLineLen = 0;
                delimLen = 0;
                result.push(currentLine);
            }
            currentLine.push(token);
            currentLineLen += delimLen + tokenLen;
        }
        return result.map((line) => line.join(" ")).join("\n");
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

        // Create per-tile LayoutBox elements.
        this._imageBoxes = offsets.map((offset) => {
            const imageBox = new LayoutBox();
            canvas.addChild(imageBox, offset.x, offset.y, tileW, tileH);
            return imageBox;
        });
        this._homeSystemBox = this._imageBoxes.shift();

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

    setSlice(miltySliceString, color, label) {
        assert(typeof miltySliceString === "string");
        assert(typeof color.r === "number");
        assert(typeof label === "string");

        const tileNumbers = Array.from(miltySliceString.matchAll(/\d+/g)).map(
            (str) => Number.parseInt(str)
        );
        assert(tileNumbers.length === 5);

        const getSystemTile = (tile) => {
            assert(typeof tile === "number");
            const imgPath = TileToImage.tileToImage(tile);
            return new ImageWidget()
                .setImageSize(this._tileW, this._tileH)
                .setImage(imgPath, refPackageId);
        };

        for (let i = 0; i < 5; i++) {
            const tile = tileNumbers[i];
            const imageBox = this._imageBoxes[i];
            imageBox.setChild(getSystemTile(tile));
        }
        this._homeSystemBox.setChild(new Border().setColor(color));

        label = MiltySliceUI.wrapLabel(label);
        this._label.setText(label);

        return this;
    }
}

module.exports = { MiltySliceUI, DEFAULT_SLICE_SCALE };
