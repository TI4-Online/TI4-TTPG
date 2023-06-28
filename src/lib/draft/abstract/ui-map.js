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

const TILE_W = 512;
const FONT_SCALE = 0.08;

class UiMap {
    static deskIndexToColorTile(deskIndex) {
        AbstractUtil.assertIsDeskIndex(deskIndex);
        return -10 - deskIndex;
    }

    constructor() {}

    /**
     * Set the map string.  Zero is home system emphasis, system tile numbers
     * can be positive for system tile images, or [-10 - deskIndex] to use the
     * desk color (-10 = 0, -11 = 1, etc).
     *
     * @param {string} mapString
     * @returns {UiMap} - self, for chaining
     */
    setMapString(mapString) {
        // TODO XXX
        return this;
    }

    setSpeaker(deskIndex) {
        AbstractUtil.assertIsDeskIndex(deskIndex);
        // TODO XXX
        return this;
    }

    /**
     * Get the UI size, also fills in per-tile and label positions as a side effect.
     *
     * @returns {Object.{w:number,h:number,tileW:number,tileH:number,positions:Array.{x:number,y:number},labelPositions:Array.{x:number,y:number}}
     */
    getSize() {
        if (!this._mapString) {
            throw new Error("must call setMapString first");
        }
    }

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

module.exports = { UiMap };
