const assert = require("../../../wrapper/assert-wrapper");
const { TileToImage } = require("../../system/tile-to-image");
const {
    Border,
    HorizontalBox,
    ImageWidget,
    LayoutBox,
    Text,
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
    constructor(scale = 1) {
        super();
        this._scale = scale;

        this._slice = new LayoutBox();
        this._label = new Text();

        this._tileW = TILE_W * this._scale;
        this._tileH = TILE_H * this._scale;

        this.setOverrideHeight(this._tileH * 3.5 + 10);
        this.setOverrideWidth(this._tileW * 3 + 10);

        this.setChild(
            new VerticalBox().addChild(this._slice).addChild(this._label)
        );
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

        const horizontalBox = new HorizontalBox();
        this._slice.setChild(horizontalBox);

        const leftBox = new VerticalBox();
        const leftPadded = new LayoutBox()
            .setChild(leftBox)
            .setPadding(0, 0, this._tileH / 2, 0)
            .setVerticalAlignment(VerticalAlignment.Top);
        horizontalBox.addChild(leftPadded);

        const centerBox = new VerticalBox();
        const centerPadded = new LayoutBox()
            .setChild(centerBox)
            .setPadding(0, 0, 0, 0)
            .setVerticalAlignment(VerticalAlignment.Top);

        horizontalBox.addChild(centerPadded);

        const rightBox = new VerticalBox();
        const rightPadded = new LayoutBox()
            .setChild(rightBox)
            .setPadding(0, 0, (this._tileH * 3) / 2, 0)
            .setVerticalAlignment(VerticalAlignment.Top);

        horizontalBox.addChild(rightPadded);

        const getSystemTile = (tile) => {
            assert(typeof tile === "number");
            const imgPath = TileToImage.tileToImage(tile);
            return new ImageWidget()
                .setImageSize(this._tileW, this._tileH)
                .setImage(imgPath, refPackageId);
        };
        leftBox
            .addChild(getSystemTile(leftEquidistant))
            .addChild(getSystemTile(leftOfHome));
        centerBox
            .addChild(getSystemTile(frontFar))
            .addChild(getSystemTile(frontOfHome));
        rightBox.addChild(getSystemTile(rightOfHome));

        centerBox.addChild(
            new LayoutBox()
                .setChild(new Border().setColor(color))
                .setOverrideHeight(this._tileH)
        );

        return this;
    }
}

module.exports = { MiltySliceUI };
