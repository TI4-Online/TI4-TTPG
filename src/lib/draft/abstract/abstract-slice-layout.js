const assert = require("../../../wrapper/assert-wrapper");
const { AbstractUtil } = require("./abstract-util");
const { Hex } = require("../../hex");
const { hexStringToIdx } = require("../../map-string/map-string-hex");
const MapStringParser = require("../../map-string/map-string-parser");
const {
    SetupGenericHomeSystems,
} = require("../../../setup/setup-generic-home-systems");
const { Vector, world } = require("../../../wrapper/api");

/**
 * Create a map string from slice shape and slices.
 * Default behavior is to anchor slices at homes and point toward center.
 */
class AbstractSliceLayout {
    /**
     * Constructor.
     */
    constructor() {
        this._shape = undefined;
        this._deskIndexToOverrideShape = {};
        this._deskIndexToSlice = {};
        this._deskIndexToHexDirection = {}; // normally point to center, can override
        this._deskIndexToAnchorHex = {}; // default to standard home system positions
    }

    /**
     * Set the slice shape.
     *
     * @param {Array.{string}} shape - list of hexes with slice pointing north, home is first entry then in slice order
     * @returns {AbstractSliceLayout} self, for chaining
     */
    setShape(shape) {
        AbstractUtil.assertIsShape(shape);
        this._shape = [...shape]; // shallow copy
        return this;
    }

    /**
     * Optionally use a different shape for a specific seat.  This is for rare
     * cases of non-symmetric layout such as the funky 7p setup.
     *
     * @param {number} deskIndex
     * @param {Array.{string}} shape
     * @returns {AbstractSliceLayout} self, for chaining
     */
    setOverrideShape(deskIndex, shape) {
        AbstractUtil.assertIsDeskIndex(deskIndex);
        AbstractUtil.assertIsShape(shape);
        this._deskIndexToOverrideShape[deskIndex] = [...shape]; // shallow copy
        return this;
    }

    setSlice(deskIndex, slice) {
        AbstractUtil.assertIsDeskIndex(deskIndex);
        AbstractUtil.assertIsSlice(slice, this._shape);
        this._deskIndexToSlice[deskIndex] = slice;
        return this;
    }

    setHexDirection(deskIndex, hex) {
        AbstractUtil.assertIsDeskIndex(deskIndex);
        AbstractUtil.assertIsHex(hex);
        this._deskIndexToHexDirection[deskIndex] = hex;
        return this;
    }

    setAnchorHex(deskIndex, hex) {
        AbstractUtil.assertIsDeskIndex(deskIndex);
        AbstractUtil.assertIsHex(hex);
        this._deskIndexToAnchorHex[deskIndex] = hex;
        return this;
    }

    generateMapString() {
        return this._defaultLayoutAll();
    }

    _defaultLayoutAll() {
        assert(this._shape);

        const playerCount = world.TI4.config.playerCount;
        for (let deskIndex = 0; deskIndex < playerCount; deskIndex++) {
            assert(this._deskIndexToSlice[deskIndex]);
        }

        const mapStringArray = [];
        for (let deskIndex = 0; deskIndex < playerCount; deskIndex++) {
            this._defaultLayoutSlice(deskIndex, mapStringArray);
        }

        const mapString = MapStringParser.format(mapStringArray);
        return mapString;
    }

    _defaultLayoutSlice(deskIndex, mapStringArray) {
        AbstractUtil.assertIsDeskIndex(deskIndex);
        const slice = this._deskIndexToSlice[deskIndex];
        AbstractUtil.assertIsSlice(slice, this._shape);
        assert(Array.isArray(mapStringArray));

        // Slice anchor position and slice "points to" direction.
        const playerDesk = world.TI4.getAllPlayerDesks()[deskIndex];
        let anchorHex = this._deskIndexToAnchorHex[deskIndex];
        if (!anchorHex) {
            const anchorPos =
                SetupGenericHomeSystems.getHomeSystemPosition(playerDesk);
            anchorHex = Hex.fromPosition(anchorPos);
        }
        const anchorMapStringIndex = hexStringToIdx(anchorHex);

        assert(!mapStringArray[anchorMapStringIndex]);
        mapStringArray[anchorMapStringIndex] = { tile: 0 };

        const dirHex =
            this._deskIndexToHexDirection[playerDesk.index] || "<0,0,0>";

        const shape = this._deskIndexToOverrideShape[deskIndex] || this._shape;

        for (let i = 0; i < slice.length; i++) {
            const tile = slice[i];
            const shapeHex = shape[i + 1];

            const hex = AbstractSliceLayout._defaultLayoutTile(
                anchorHex,
                dirHex,
                shapeHex,
                tile,
                mapStringArray
            );

            const mapStringIndex = hexStringToIdx(hex);
            if (mapStringArray[mapStringIndex]) {
                console.log(
                    `AbstractSliceLayout._defaultLayoutSlice: collision at index ${mapStringIndex}`
                );
            }
            mapStringArray[mapStringIndex] = { tile }; // modify map string array in place
        }
    }

    static _defaultLayoutTile(anchorHex, dirHex, shapeHex, tile) {
        AbstractUtil.assertIsHex(anchorHex);
        AbstractUtil.assertIsHex(dirHex);
        AbstractUtil.assertIsHex(shapeHex);
        assert(typeof tile === "number");

        const anchorPos = Hex.toPosition(anchorHex);
        const dirPos = Hex.toPosition(dirHex);
        const dir = dirPos.subtract(anchorPos);
        const shapeOffset = Hex.toPosition(shapeHex);

        const theta = Math.atan2(dir.y, dir.x);
        const cos = Math.cos(theta);
        const sin = Math.sin(theta);

        // Rotate offset in direction.
        let dx = cos * shapeOffset.x - sin * shapeOffset.y;
        let dy = sin * shapeOffset.x + cos * shapeOffset.y;

        dx = Math.floor(dx * 1000) / 1000;
        dy = Math.floor(dy * 1000) / 1000;

        const pos = new Vector(anchorPos.x + dx, anchorPos.y + dy, anchorPos.z);
        const hex = Hex.fromPosition(pos);
        return hex;
    }
}

module.exports = { AbstractSliceLayout };
