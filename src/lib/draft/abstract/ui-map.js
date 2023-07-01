const assert = require("../../../wrapper/assert-wrapper");
const MapStringHex = require("../../map-string/map-string-hex");
const MapStringParser = require("../../map-string/map-string-parser");
const { AbstractUtil } = require("./abstract-util");
const { AbstractSliceLayout } = require("./abstract-slice-layout");
const { AbstractPlaceHyperlanes } = require("./abstract-place-hyperlanes");
const { Hex } = require("../../hex");
const { Hyperlane } = require("../../map-string/hyperlane");
const {
    Canvas,
    HorizontalAlignment,
    ImageWidget,
    LayoutBox,
    Text,
    TextJustification,
    VerticalAlignment,
    refPackageId,
    world,
} = require("../../../wrapper/api");

const TILE_W = 50;
const FONT_SCALE = 0.14;

const ORDER_LABEL = [
    "Speaker",
    "2nd",
    "3rd",
    "4th",
    "5th",
    "6th",
    "7th",
    "8th",
];

class UiMap {
    static deskIndexToColorTile(deskIndex, isHome) {
        AbstractUtil.assertIsDeskIndex(deskIndex);
        assert(typeof isHome === "boolean");
        let tile = 100000 + deskIndex * 2;
        if (isHome) {
            tile += 1;
        }
        return tile;
    }

    static tileToDeskIndexAndIsHome(tile) {
        assert(typeof tile === "number");
        const n = tile - 100000;
        const deskIndex = Math.floor(n / 2);
        const isHome = n % 2 === 1;
        return { deskIndex, isHome };
    }

    static geterateMapString(params) {
        assert(typeof params === "object");

        AbstractUtil.assertIsShape(params.shape);
        assert(params.sliceLayout instanceof AbstractSliceLayout);

        const sliceLayout = params.sliceLayout;
        const placeHyperlanes =
            params.placeHyperlanes || new AbstractPlaceHyperlanes();

        const chooserToSlice = params.chooserToSlice || {};
        const chooserToSeatIndex = params.chooserToSeatIndex || {};
        const chooserToFaction = params.chooserToFaction || {};

        // Seed generic slices.
        for (
            let deskIndex = 0;
            deskIndex < world.TI4.config.playerCount;
            deskIndex++
        ) {
            // Home system.
            const home = UiMap.deskIndexToColorTile(deskIndex, true);
            sliceLayout.setAnchorTile(deskIndex, home);

            // Non-home slice systems.
            const tile = UiMap.deskIndexToColorTile(deskIndex, false);
            const slice = new Array(params.shape.length - 1).fill(tile);
            sliceLayout.setSlice(deskIndex, slice);
        }

        // Overwrite known slices.
        for (const [chooser, slice] of Object.entries(chooserToSlice)) {
            const deskIndex = chooserToSeatIndex[chooser];
            if (deskIndex !== undefined) {
                sliceLayout.setSlice(deskIndex, slice);
            }
        }

        // Overwrite known home systems.
        if (params.includeHomeSystems) {
            for (const [chooser, factionName] of Object.entries(
                chooserToFaction
            )) {
                AbstractUtil.assertIsFaction(factionName);
                const deskIndex = chooserToSeatIndex[chooser];
                const faction = world.TI4.getFactionByNsidName(factionName);
                const home = faction.home;
                if (deskIndex !== undefined) {
                    sliceLayout.setAnchorTile(deskIndex, home);
                }
            }
        }

        const playerDesks = world.TI4.getAllPlayerDesks();
        const deskIndexToLabel = {};
        for (const [chooser, seatIndex] of Object.entries(chooserToSeatIndex)) {
            const chooserDesk = playerDesks[chooser];
            assert(chooserDesk);
            const chooserSlot = chooserDesk.playerSlot;
            const chooserPlayer = world.getPlayerBySlot(chooserSlot);
            if (chooserPlayer) {
                const chooserName = chooserPlayer.getName();
                deskIndexToLabel[seatIndex] = chooserName;
            }
        }

        let mapString = sliceLayout.generateMapString();

        const hyperlanesMapString = Hyperlane.getMapString(
            world.TI4.config.playerCount
        );
        if (hyperlanesMapString) {
            mapString = placeHyperlanes.placeHyperlanes(
                mapString,
                hyperlanesMapString
            );
        }

        return { mapString, deskIndexToLabel };
    }

    constructor() {
        this._scale = 1;

        this._mapString = undefined;
        this._deskIndexToLabel = {};
    }

    /**
     * Set the map string.  Zero is home system emphasis, system tile numbers
     * can be positive for system tile images, or [-10 - deskIndex] to use the
     * desk color (-10 = 0, -11 = 1, etc).
     *
     * @param {string} mapString
     * @returns {UiMap} - self, for chaining
     */
    setMapString(mapString) {
        AbstractUtil.assertIsMapString(mapString);
        this._mapString = mapString;
        return this;
    }

    setScale(scale) {
        assert(typeof scale === "number");
        this._scale = scale;
        return this;
    }

    setLabel(deskIndex, label) {
        AbstractUtil.assertIsDeskIndex(deskIndex);
        assert(!label || typeof label === "string");
        this._deskIndexToLabel[deskIndex] = label;
        return this;
    }

    setSpeaker(speakerDeskIndex) {
        AbstractUtil.assertIsDeskIndex(speakerDeskIndex);
        this._speakerDeskIndex = speakerDeskIndex;
        return this;
    }

    /**
     * Get the UI size, also fills in per-tile and label positions as a side effect.
     *
     * @returns {Object.{w:number,h:number,tileW:number,tileH:number,positions:Array.{x:number,y:number,tile:number}}}
     */
    getSize() {
        if (!this._mapString) {
            throw new Error("must call setMapString first");
        }

        const scale = (TILE_W / (Hex.HALF_SIZE * 2)) * this._scale;
        const halfW = Math.ceil(Hex.HALF_SIZE * scale);
        const halfH = Math.ceil(halfW * 0.866);

        // Get the bounding box and scaled positions.
        const bb = {
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
        };
        const positions = [];

        const mapStringEntries = MapStringParser.parse(this._mapString);

        const first = mapStringEntries[0];
        if (first.tile < 0) {
            first.tile = 18;
        }

        mapStringEntries.forEach((entry, index) => {
            const hex = MapStringHex.idxToHexString(index);
            const pos = Hex.toPosition(hex);
            [pos.x, pos.y] = [pos.y, -pos.x]; // TTPG x/y are reversed, "Y" inverted
            pos.x = Math.floor(pos.x * scale);
            pos.y = Math.floor(pos.y * scale);
            pos.tile = entry.tile;
            positions.push(pos);
            if (pos.x - halfW < bb.left) {
                bb.left = pos.x - halfW;
            }
            if (pos.x + halfW > bb.right) {
                bb.right = pos.x + halfW;
            }
            if (pos.y - halfH < bb.top) {
                bb.top = pos.y - halfH;
            }
            if (pos.y + halfH > bb.bottom) {
                bb.bottom = pos.y + halfH;
            }
        });

        // Adjust positions to be relative to top-left.
        for (const pos of positions) {
            pos.x = pos.x - bb.left;
            pos.y = pos.y - bb.top;
        }

        return {
            w: bb.right - bb.left,
            h: bb.bottom - bb.top,
            halfW,
            halfH,
            tileW: halfW * 2,
            tileH: halfH * 2,
            fontSize: Math.ceil(halfW * 2 * FONT_SCALE),
            positions,
        };
    }

    createWidget() {
        const size = this.getSize();

        const canvas = new Canvas(size.w, size.h);

        const layoutBox = new LayoutBox()
            .setOverrideWidth(size.w)
            .setOverrideHeight(size.h)
            .setChild(canvas);

        this.drawToCanvas(canvas);

        return layoutBox;
    }

    drawToCanvas(canvas, offset = { x: 0, y: 0 }) {
        assert(canvas instanceof Canvas);
        assert(typeof offset.x === "number");
        assert(typeof offset.y === "number");

        if (!this._mapString) {
            throw new Error("must call setMapString first");
        }

        const size = this.getSize();
        const playerDeskArray = world.TI4.getAllPlayerDesks();

        // Positions include "color tile" encoded tile number.
        for (const pos of size.positions) {
            if (pos.tile < 0) {
                continue;
            }

            // Add anonymous image (set image later).
            const image = new ImageWidget();
            const pad = Math.ceil(1 * this._scale);
            canvas.addChild(
                image,
                offset.x + pos.x - size.halfW + pad,
                offset.y + pos.y - size.halfW + pad, // image is square
                size.tileW - pad * 2,
                size.tileW - pad * 2
            );

            const { deskIndex, isHome } = UiMap.tileToDeskIndexAndIsHome(
                pos.tile
            );
            if (pos.tile >= 100000) {
                const color = playerDeskArray[deskIndex].widgetColor.clone();
                if (isHome) {
                    const darken = 0.5;
                    color.r = color.r * darken;
                    color.g = color.g * darken;
                    color.b = color.b * darken;
                }
                image
                    .setImage("global/ui/tiles/blank.png", refPackageId)
                    .setTintColor(color);
            } else {
                const system = world.TI4.getSystemByTileNumber(pos.tile);
                assert(system);
                const imgPath = system.raw.img;
                const packageId = system.raw.packageId
                    ? system.raw.packageId
                    : refPackageId;
                image.setImage(imgPath, packageId);
            }

            // Label?
            if (isHome) {
                const playerCount = world.TI4.config.playerCount;
                const order =
                    (deskIndex - this._speakerDeskIndex + playerCount) %
                    playerCount;
                const orderLabel = ORDER_LABEL[order].toUpperCase();
                const customLabel = this._deskIndexToLabel[deskIndex];

                const label = customLabel
                    ? `${orderLabel}\n${customLabel}`
                    : orderLabel;
                const text = new Text()
                    .setAutoWrap(false) // DO NOT WRAP
                    .setBold(true)
                    .setJustification(TextJustification.Center)
                    .setFontSize(size.fontSize)
                    .setTextColor([0, 0, 0, 1])
                    .setText(label);

                const textBox = new LayoutBox()
                    .setOverrideWidth(size.tileW)
                    .setOverrideHeight(size.tileH)
                    .setHorizontalAlignment(HorizontalAlignment.Center)
                    .setVerticalAlignment(VerticalAlignment.Center)
                    .setChild(text);

                const extra = size.halfW;
                canvas.addChild(
                    textBox,
                    offset.x + pos.x - size.halfW - extra,
                    offset.y + pos.y - size.halfH - extra,
                    size.tileW + extra * 2,
                    size.tileH + extra * 2
                );
            }
        }
    }
}

module.exports = { UiMap };
