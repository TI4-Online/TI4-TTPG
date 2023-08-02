const assert = require("../../../wrapper/assert-wrapper");
const MapStringHex = require("../../map-string/map-string-hex");
const MapStringParser = require("../../map-string/map-string-parser");
const { AbstractUtil } = require("./abstract-util");
const { Hex } = require("../../hex");
const { Hyperlane } = require("../../map-string/hyperlane");
const {
    SetupGenericHomeSystems,
} = require("../../../setup/setup-generic-home-systems");
const {
    Border,
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
const MAX_LABEL_LENGTH = 8;

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

    static generateMapString(sliceDraft, options) {
        assert(sliceDraft);
        assert(typeof options === "object");

        const playerCount = world.TI4.config.playerCount;
        const playerDesks = world.TI4.getAllPlayerDesks();
        const shape = sliceDraft.getSliceGenerator()?.getSliceShape();
        AbstractUtil.assertIsShape(shape);
        const sliceLayout = sliceDraft.getSliceLayout();
        assert(sliceLayout);
        const placeHyperlanes = sliceDraft.getPlaceHyperlanes();
        assert(placeHyperlanes);

        // Seed generic slices.
        for (let deskIndex = 0; deskIndex < playerCount; deskIndex++) {
            // Home system.
            const home = UiMap.deskIndexToColorTile(deskIndex, true);
            sliceLayout.setAnchorTile(deskIndex, home);

            // Non-home slice systems.
            const tile = UiMap.deskIndexToColorTile(deskIndex, false);
            const slice = new Array(shape.length - 1).fill(tile);
            sliceLayout.setSlice(deskIndex, slice);
        }

        // Overwrite known slices.
        for (let chooser = 0; chooser < playerCount; chooser++) {
            const slice = sliceDraft.getChooserSlice(chooser);
            const deskIndex = sliceDraft.getChooserSeatIndex(chooser);
            if (slice === undefined || deskIndex === undefined) {
                continue;
            }
            sliceLayout.setSlice(deskIndex, slice);
        }

        // Overwrite known home systems?
        if (options.includeHomeSystems) {
            for (let chooser = 0; chooser < playerCount; chooser++) {
                const factionName = sliceDraft.getChooserFaction(chooser);
                const deskIndex = sliceDraft.getChooserSeatIndex(chooser);
                if (factionName === undefined || deskIndex === undefined) {
                    continue;
                }
                const faction = world.TI4.getFactionByNsidName(factionName);
                const home = faction.home;
                sliceLayout.setAnchorTile(deskIndex, home);
            }
        }

        if (options.zeroHomeSystems) {
            for (let deskIndex = 0; deskIndex < playerCount; deskIndex++) {
                sliceLayout.setAnchorTile(deskIndex, 0);
            }
        }

        // Overwrite labels.
        const deskIndexToLabel = {};
        for (let chooser = 0; chooser < playerCount; chooser++) {
            const deskIndex = sliceDraft.getChooserSeatIndex(chooser);
            if (deskIndex === undefined) {
                continue;
            }
            let labelParts = [];

            // Add player name.
            const chooserDesk = playerDesks[chooser];
            assert(chooserDesk);
            const chooserSlot = chooserDesk.playerSlot;
            const chooserPlayer = world.getPlayerBySlot(chooserSlot);
            if (chooserPlayer) {
                labelParts.push(chooserPlayer.getName());
            } else {
                labelParts.push(`"${chooserDesk.colorName}"`);
            }

            // Add faction name (if known).
            const factionName = sliceDraft.getChooserFaction(chooser);
            if (factionName) {
                const faction = world.TI4.getFactionByNsidName(factionName);
                labelParts.push(faction.nameAbbr.toUpperCase());
            }

            // Truncate long labels.
            labelParts = labelParts.map((label) => {
                if (label.length > MAX_LABEL_LENGTH) {
                    label = label.substring(0, MAX_LABEL_LENGTH);
                }
                return label;
            });

            deskIndexToLabel[deskIndex] = labelParts.join("\n");
        }

        let mapString = sliceLayout.generateMapString();
        const mapStringEntries = MapStringParser.parse(mapString);

        // Add mecatol to map string entries.
        const first = mapStringEntries[0];
        if (first && first.tile < 0) {
            first.tile = 18;
        }

        // Add fixed systems to map string entries.
        const fixedSystemsGenerator = sliceDraft.getFixedSystemsGenerator();
        if (fixedSystemsGenerator) {
            const fixedHexes = fixedSystemsGenerator.getFixedHexes();
            const fixedSystems = sliceDraft.getFixedSystems();
            if (fixedSystems) {
                AbstractUtil.assertValidSystems(fixedSystems);
                assert(fixedSystems.length === fixedHexes.length);
            }
            for (let index = 0; index < fixedHexes.length; index++) {
                const hex = fixedHexes[index];
                const tile = fixedSystems ? fixedSystems[index] : -10 - index;
                const mapStringIndex = MapStringHex.hexStringToIdx(hex);
                assert(typeof mapStringIndex === "number");
                if (
                    mapStringEntries[mapStringIndex] &&
                    mapStringEntries[mapStringIndex].tile !== -1
                ) {
                    // something already in this spot!
                    throw new Error(
                        `UiMap.generateMapString: "${hex}" already occupied`
                    );
                }
                mapStringEntries[mapStringIndex] = { tile };
            }
        }

        mapString = MapStringParser.format(mapStringEntries);

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
        this._hexToLabel = {};
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

        const playerDesk = world.TI4.getAllPlayerDesks()[deskIndex];
        assert(playerDesk);
        const pos = SetupGenericHomeSystems.getHomeSystemPosition(playerDesk);
        const hex = Hex.fromPosition(pos);

        this._hexToLabel[hex] = label;
        return this;
    }

    setMultipleLabels(deskIndexToLabel) {
        for (const [deskIndexStr, label] of Object.entries(deskIndexToLabel)) {
            const deskIndex = Number.parseInt(deskIndexStr);
            this.setLabel(deskIndex, label);
        }
        return this;
    }

    setSpeakerIndex(speakerDeskIndex) {
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
            pos.hex = hex;
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

        const canvas = new Canvas();

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
            // Skip home system and standard empty encodings.
            if (pos.tile === 0 || pos.tile === -1) {
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

            // Tile is either a valid system or encoded for desk/home.
            const system = world.TI4.getSystemByTileNumber(pos.tile);
            const { deskIndex, isHome } = UiMap.tileToDeskIndexAndIsHome(
                pos.tile
            );

            if (pos.tile <= -10) {
                // Fixed system but no assigned tile.
                const fixedIndex = Math.abs(pos.tile + 10);
                const c = 0.2;
                const color = [c, c, c, 1];
                image
                    .setImage("global/ui/tiles/blank.png", refPackageId)
                    .setTintColor(color);
                const text = new Text()
                    .setFontSize(20 * this._scale)
                    .setBold(true)
                    .setJustification(TextJustification.Center)
                    .setText(fixedIndex + 1); // make 1 based
                canvas.addChild(
                    text,
                    offset.x + pos.x - size.halfW,
                    offset.y + pos.y - text.getFontSize() * 0.8,
                    size.tileW,
                    text.getFontSize() * 2
                );
            } else if (pos.tile >= 100000) {
                // Generic per-desk tile and/or home system.
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
            } else if (system && system.hyperlane) {
                // Hyperlane.  Cannot rotate so use simple gray.
                const c = 0.2;
                const color = [c, c, c, 1];
                image
                    .setImage("global/ui/tiles/blank.png", refPackageId)
                    .setTintColor(color);
                const text = new Text()
                    .setFontSize(20 * this._scale)
                    .setBold(true)
                    .setJustification(TextJustification.Center)
                    .setText("*");
                canvas.addChild(
                    text,
                    offset.x + pos.x - size.halfW,
                    offset.y + pos.y - text.getFontSize() * 0.8,
                    size.tileW,
                    text.getFontSize() * 2
                );
            } else if (system) {
                const imgPath = system.img;
                const packageId = system.packageId;
                image.setImage(imgPath, packageId);
            }
        }

        // Add labels in a second pass (after system tiles are down).
        for (const pos of size.positions) {
            const { deskIndex, isHome } = UiMap.tileToDeskIndexAndIsHome(
                pos.tile
            );

            // If the tile number is the special one indicating a home system
            // label with speaker order.
            let label = this._hexToLabel[pos.hex];
            if (!label && isHome && this._speakerDeskIndex !== undefined) {
                const playerCount = world.TI4.config.playerCount;
                const order =
                    (deskIndex - this._speakerDeskIndex + playerCount) %
                    playerCount;
                label = ORDER_LABEL[order].toUpperCase();
            }

            if (label) {
                const text = new Text()
                    .setAutoWrap(false) // DO NOT WRAP
                    .setBold(true)
                    .setJustification(TextJustification.Center)
                    .setFontSize(size.fontSize)
                    .setTextColor([0, 0, 0, 1])
                    .setText(label);

                let textWidget = text;

                // Custom labels use white and have a translucent background.
                if (this._hexToLabel[pos.hex]) {
                    text.setTextColor([1, 1, 1, 1]);

                    textWidget = new Border()
                        .setChild(text)
                        .setColor([0, 0, 0, 0.75]);
                }

                const textBox = new LayoutBox()
                    .setOverrideWidth(size.tileW)
                    .setOverrideHeight(size.tileH)
                    .setHorizontalAlignment(HorizontalAlignment.Center)
                    .setVerticalAlignment(VerticalAlignment.Center)
                    .setChild(textWidget);

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

module.exports = { UiMap, ORDER_LABEL };
