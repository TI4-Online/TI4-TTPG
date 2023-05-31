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

const TILE_W = 512;
const FONT_SCALE = 0.08;

class UiMap {
    constructor() {}

    setHyperlanes(abstractPlaceHyperlanes) {}

    setShape(shape) {}

    setSlice(deskIndex, slice) {}

    setSpeaker(deskIndex) {}

    createWidget() {}

    drawToCanvas(canvas, offset = { x: 0, y: 0 }) {
        assert(canvas instanceof Canvas);
        assert(typeof offset.x === "number");
        assert(typeof offset.y === "number");

        if (!this._shape) {
            throw new Error("must call setSlice first");
        }
    }
}
