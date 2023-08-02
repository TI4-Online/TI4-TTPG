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
        this._deskIndexToAnchorTile = {}; // default to zero
        this._fixedSystemsHexToTile = {};

        this._collisions = [];
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

    /**
     * By default slices point toward "<0,0,0>"", this overrides.
     *
     * @param {number} deskIndex
     * @param {string} hex
     * @returns {AbstractSliceLayout} self, for chaining
     */
    setHexDirection(deskIndex, hex) {
        AbstractUtil.assertIsDeskIndex(deskIndex);
        AbstractUtil.assertIsHex(hex);
        this._deskIndexToHexDirection[deskIndex] = hex;
        return this;
    }

    /**
     * By default home systems follow standard layout.  This overrides.
     *
     * @param {number} deskIndex
     * @param {string} hex
     * @returns {AbstractSliceLayout} self, for chaining
     */
    setAnchorHex(deskIndex, hex) {
        AbstractUtil.assertIsDeskIndex(deskIndex);
        AbstractUtil.assertIsHex(hex);
        this._deskIndexToAnchorHex[deskIndex] = hex;
        return this;
    }

    /**
     * By default home systems get "0" in the map string.  This overrides.
     *
     * @param {number} deskIndex
     * @param {number} tile
     * @returns {AbstractSliceLayout} self, for chaining
     */
    setAnchorTile(deskIndex, tile) {
        AbstractUtil.assertIsDeskIndex(deskIndex);
        assert(typeof tile === "number");
        this._deskIndexToAnchorTile[deskIndex] = tile;
        return this;
    }

    /**
     * Add fixed systems.
     *
     * @param {object.{hex:string,tile:number}} hexToTile
     * @returns {AbstractSliceLayout} self, for chaining
     */
    addFixedSystems(hexToTile) {
        AbstractUtil.assertIsHexToTile(hexToTile);
        for (const [hex, tile] of Object.entries(hexToTile)) {
            assert(!this._fixedSystemsHexToTile[hex]);
            this._fixedSystemsHexToTile[hex] = tile;
        }
        return this;
    }

    generateMapString() {
        return this._defaultLayoutAll();
    }

    _defaultLayoutAll() {
        assert(this._shape);

        // Make sure every desk has a slice.
        const playerCount = world.TI4.config.playerCount;
        for (let deskIndex = 0; deskIndex < playerCount; deskIndex++) {
            assert(this._deskIndexToSlice[deskIndex]);
        }

        const mapStringArray = [];
        this._collisions = [];

        // Add fixed systems.  Cannot collide because hex are unique map keys.
        for (const [hex, tile] of Object.entries(this._fixedSystemsHexToTile)) {
            const index = hexStringToIdx(hex);
            mapStringArray[index] = tile;
        }

        // Layout slices.
        for (let deskIndex = 0; deskIndex < playerCount; deskIndex++) {
            this._defaultLayoutSlice(deskIndex, mapStringArray);
        }

        // This is where collisions should be fixed (move to open spots?).

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

        const dirHex =
            this._deskIndexToHexDirection[playerDesk.index] || "<0,0,0>";

        const shape = this._deskIndexToOverrideShape[deskIndex] || this._shape;
        const homeSystemTile = this._deskIndexToAnchorTile[deskIndex] || 0;

        for (let i = 0; i < shape.length; i++) {
            const tile = i > 0 ? slice[i - 1] : homeSystemTile;
            const shapeHex = shape[i];

            const hex = AbstractSliceLayout._defaultLayoutTile(
                anchorHex,
                dirHex,
                shapeHex
            );

            const mapStringIndex = hexStringToIdx(hex);
            if (mapStringArray[mapStringIndex]) {
                const err = `AbstractSliceLayout._defaultLayoutSlice: collision at index ${mapStringIndex} (${tile} vs ${mapStringArray[mapStringIndex].tile})`;
                console.log(err);

                // Preserve the original, but keep a record of this dropped tile.
                this._collisions.push({
                    hex,
                    mapStringIndex,
                    tile,
                    collisionWith: mapStringArray[mapStringIndex],
                });
                continue;
            }
            mapStringArray[mapStringIndex] = { tile }; // modify map string array in place
        }
    }

    static _defaultLayoutTile(anchorHex, dirHex, shapeHex) {
        AbstractUtil.assertIsHex(anchorHex);
        AbstractUtil.assertIsHex(dirHex);
        AbstractUtil.assertIsHex(shapeHex);

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

    /**
     * Sometimes layout get tricky (e.g. 7 and 8 player hyperlane).  This
     * method lets layout writers point where the tile *should* go.
     *
     * THIS IS MEANT FOR DEV TIME, TO GET THE "CHEAP" SHAPEHEX VALUE!
     *
     * @param {string} anchorHex
     * @param {string} dirHex
     * @param {string} targetHex
     */
    static _helpMeFindShapeHex(anchorHex, dirHex, targetHex) {
        AbstractUtil.assertIsHex(anchorHex);
        AbstractUtil.assertIsHex(dirHex);
        AbstractUtil.assertIsHex(targetHex);

        // Brute force.
        for (let i = -10; i < 10; i++) {
            for (let j = -10; j < 10; j++) {
                const k = -(i + j);
                const shapeHex = `<${i},${j},${k}>`;
                const layoutHex = AbstractSliceLayout._defaultLayoutTile(
                    anchorHex,
                    dirHex,
                    shapeHex
                );
                if (layoutHex === targetHex) {
                    throw new Error(`_helpMeFindShapeHex: ${shapeHex}`);
                }
            }
        }
        throw new Error("_helpMeFindShapeHex: not found");
    }
}

module.exports = { AbstractSliceLayout };
