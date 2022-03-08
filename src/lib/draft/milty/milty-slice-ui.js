const assert = require("../../../wrapper/assert-wrapper");
const { TileToImage } = require("../../system/tile-to-image");
const {
    Border,
    HorizontalAlignment,
    HorizontalBox,
    ImageWidget,
    LayoutBox,
    Text,
    TextJustification,
    VerticalAlignment,
    VerticalBox,
    refPackageId,
} = require("../../../wrapper/api");

const TILE_W = 20;
const TILE_H = Math.floor((TILE_W * 3) / 2);

/**
 * Draw a milty slice as a UI Widget.
 */
class MiltySliceUI extends LayoutBox {
    static getSize(scale = 1) {
        const tileW = Math.floor(TILE_W * scale);
        const tileH = Math.floor(TILE_H * scale);
        const w = tileW * 3 + 10;
        const h = tileH * 4 + 10;
        return [w, h];
    }

    constructor(scale = 1) {
        super();
        this._scale = scale;

        const fontSize = Math.min(255, Math.floor(8 * scale));
        this._label = new Text()
            .setFontSize(fontSize)
            .setJustification(TextJustification.Center);

        this._tileW = Math.floor(TILE_W * this._scale);
        this._tileH = Math.floor(TILE_H * this._scale);

        // Size correctly even if a slice isn't set.
        // Use a slightly larger than expected box to prevent scrollbars.
        const [w, h] = MiltySliceUI.getSize(scale);
        this.setOverrideHeight(h)
            .setOverrideWidth(w)
            .setHorizontalAlignment(HorizontalAlignment.Center)
            .setVerticalAlignment(VerticalAlignment.Center);

        this._leftLayout = new LayoutBox()
            .setPadding(0, 0, this._tileH / 2, 0)
            .setVerticalAlignment(VerticalAlignment.Top);
        this._centerLayout = new LayoutBox()
            .setPadding(0, 0, 0, 0)
            .setVerticalAlignment(VerticalAlignment.Top);
        this._rightLayout = new LayoutBox()
            .setPadding(0, 0, (this._tileH * 3) / 2, 0)
            .setVerticalAlignment(VerticalAlignment.Top);

        const slicePanel = new HorizontalBox()
            .addChild(this._leftLayout)
            .addChild(this._centerLayout)
            .addChild(this._rightLayout);

        const overallPanel = new VerticalBox()
            .addChild(slicePanel)
            .addChild(this._label);

        this.setChild(overallPanel);
    }

    setSlice(miltySliceString, color, label) {
        assert(typeof miltySliceString === "string");
        assert(typeof color.r === "number");
        assert(typeof label === "string");

        const tileNumbers = Array.from(miltySliceString.matchAll(/\d+/g)).map(
            (str) => Number.parseInt(str)
        );
        assert(tileNumbers.length === 5);
        const [
            leftOfHome,
            frontOfHome,
            rightOfHome,
            leftEquidistant,
            frontFar,
        ] = tileNumbers;

        const getSystemTile = (tile) => {
            assert(typeof tile === "number");
            const imgPath = TileToImage.tileToImage(tile);
            return new ImageWidget()
                .setImageSize(this._tileW, this._tileH)
                .setImage(imgPath, refPackageId);
        };

        const leftBox = new VerticalBox();
        this._leftLayout.setChild(leftBox);
        leftBox
            .addChild(getSystemTile(leftEquidistant))
            .addChild(getSystemTile(leftOfHome));

        const centerBox = new VerticalBox();
        this._centerLayout.setChild(centerBox);
        centerBox
            .addChild(getSystemTile(frontFar))
            .addChild(getSystemTile(frontOfHome))
            .addChild(
                new LayoutBox()
                    .setChild(new Border().setColor(color))
                    .setOverrideHeight(this._tileH)
            );

        const rightBox = new VerticalBox();
        this._rightLayout.setChild(rightBox);
        rightBox.addChild(getSystemTile(rightOfHome));

        this._label.setText(label);

        return this;
    }
}

module.exports = { MiltySliceUI };
