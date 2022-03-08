const assert = require("../../../wrapper/assert-wrapper");
const { TileToImage } = require("../../system/tile-to-image");
const {
    Border,
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
    constructor(scale = 1) {
        super();
        this._scale = scale;

        const fontSize = Math.min(255, Math.floor(8 * scale));
        this._label = new Text()
            .setFontSize(fontSize)
            .setJustification(TextJustification.Center);

        this._tileW = TILE_W * this._scale;
        this._tileH = TILE_H * this._scale;

        //this.setOverrideHeight(this._tileH * 3.5 + 10);
        //this.setOverrideWidth(this._tileW * 3 + 10);

        this._leftLayout = new LayoutBox()
            .setPadding(0, 0, this._tileH / 2, 0)
            .setVerticalAlignment(VerticalAlignment.Top);
        this._centerLayout = new LayoutBox()
            .setPadding(0, 0, 0, 0)
            .setVerticalAlignment(VerticalAlignment.Top);
        this._rightLayout = new LayoutBox()
            .setPadding(0, 0, (this._tileH * 3) / 2, 0)
            .setVerticalAlignment(VerticalAlignment.Top);

        const horizontalBox = new HorizontalBox()
            .addChild(this._leftLayout)
            .addChild(this._centerLayout)
            .addChild(this._rightLayout);
        this.setChild(
            new VerticalBox()
                .addChild(horizontalBox) // slice
                .addChild(this._label) // label
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
