const assert = require("../../../wrapper/assert-wrapper");
const locale = require("../../locale");
const { ColorUtil } = require("../../color/color-util");
const { FactionTokenUI } = require("../milty/faction-token-ui");
const { Hex } = require("../../hex");
const MapStringHex = require("../../map-string/map-string-hex");
const { MiltyEqSliceUI } = require("./milty-eq-slice-ui");
const { MiltyEqSliceLayout } = require("./milty-eq-slice-layout");
const { SeatTokenUI } = require("../milty/seat-token-ui");
const CONFIG = require("../../../game-ui/game-ui-config");
const {
    Border,
    Button,
    Canvas,
    Color,
    HorizontalAlignment,
    ImageWidget,
    LayoutBox,
    Text,
    VerticalAlignment,
    Widget,
    refPackageId,
    world,
} = require("../../../wrapper/api");

const NUM_SLICE_ROWS = 3;
const NUM_FACTION_ROWS = 6;

const DEFAULT_SLICE_COLORS = [
    "#CB0000", // red
    "#007306", // green
    "#FF4500", // orange
    "#F46FCD", // pink
    "#D6B700", // yellow
    "#7400B7", // purple
    "#07B2FF", // blue
    "#8B8B8B", // white
    "#00CAB1", // teal
];

class MiltyEqDraftUI {
    constructor(playerDesk, scale) {
        assert(playerDesk);
        assert(typeof scale === "number" && scale >= 1);

        this._playerDesk = playerDesk;
        this._scale = scale;
        this._canvas = new Canvas();
        this._sliceSize = MiltyEqSliceUI.getSize(this._scale);
        this._pad = Math.floor(this._sliceSize.tileH / 3);

        this._waitingFor = new Text().setText("<>");

        // Fix height.
        const pad = this._pad;
        const sliceH = this._sliceSize.sliceH;
        assert(sliceH);
        this._h = pad + (sliceH + pad) * NUM_SLICE_ROWS;

        // Grow when adding things.
        this._nextX = pad;
        this._w = pad;

        this._updateWaitingFor = () => {
            const currentDesk = world.TI4.turns.getCurrentTurn();
            if (!currentDesk) {
                return;
            }
            let value;
            if (currentDesk === this._playerDesk) {
                value = locale("ui.agenda.clippy.your_turn");
            } else {
                const playerName = currentDesk.colorName;
                value = locale("ui.agenda.clippy.waiting_for_player_name", {
                    playerName,
                });
            }
            this._waitingFor.setText(value);
        };
    }

    /**
     * Lock-in layout, return widget and size.
     *
     * @returns {Object.{widget:Widget,w:number,h:number}}
     */
    getWidgetAndSize(onFinishedButton) {
        assert(onFinishedButton instanceof Button);

        const { sliceW, tileH } = this._sliceSize;

        const w = sliceW * 3 + this._pad * 2;
        const h = tileH;
        const x = (this._w - w) / 2;
        let y = this._h;
        const fontSize = Math.min(255, Math.floor(h * 0.3));

        // Add "waiting for player".
        const waitingForBox = new LayoutBox()
            .setHorizontalAlignment(HorizontalAlignment.Center)
            .setVerticalAlignment(VerticalAlignment.Center)
            .setChild(this._waitingFor);
        this._canvas.addChild(waitingForBox, 0, y, this._w, h);
        this._h += tileH + this._pad;
        this._waitingFor.setFontSize(fontSize);

        // Add "ready" button.
        y = this._h;
        this._canvas.addChild(onFinishedButton, x, y, w, h);
        this._h += tileH + this._pad;

        // Set it up here, as part of UI.
        onFinishedButton
            .setText(locale("ui.button.ready"))
            .setFontSize(fontSize)
            .setEnabled(false);

        this._updateWaitingFor();

        const widget = new Border()
            .setColor(CONFIG.backgroundColor)
            .setChild(this._canvas);

        return {
            widget,
            w: this._w,
            h: this._h,
            updateWaitingFor: this._updateWaitingFor,
        };
    }

    addSlices(sliceDataArray) {
        assert(Array.isArray(sliceDataArray));

        sliceDataArray.forEach((sliceData) => {
            assert(Array.isArray(sliceData.slice));
            assert(!sliceData.color || ColorUtil.isColor(sliceData.color));
            assert(typeof sliceData.label === "string");
            assert(typeof sliceData.onClickedGenerator === "function");
        });

        const { sliceW, sliceH } = this._sliceSize;
        let row = 0;
        sliceDataArray.forEach((sliceData, index) => {
            // Grow when starting a new column.
            if (row === 0) {
                this._w += sliceW + this._pad;
            }

            const offset = {
                x: this._nextX,
                y: this._pad + row * (sliceH + this._pad),
            };

            // Push to next column for next when full.
            row = (row + 1) % NUM_SLICE_ROWS;
            if (row === 0) {
                this._nextX += sliceW + this._pad;
            }

            const color = sliceData.color
                ? sliceData.color
                : ColorUtil.colorFromHex(DEFAULT_SLICE_COLORS[index]);

            new MiltyEqSliceUI(this._canvas, offset, this._scale)
                .setSlice(sliceData.slice)
                .setColor(color)
                .setLabel(sliceData.label, sliceData.onClickedGenerator);
        });

        // If stopped before finishing row still advance to next "column".
        if (row > 0) {
            this._nextX += sliceW + this._pad;
        }

        return this;
    }

    addEqs(eqs, seatDataArray) {
        assert(Array.isArray(eqs));
        assert(eqs.length === world.TI4.config.playerCount);
        eqs.forEach((tile) => {
            assert(typeof tile === "number");
        });
        assert(Array.isArray(seatDataArray));

        const { tileW, tileH } = this._sliceSize;
        const center = {
            x: this._nextX + tileW * 2.5,
            y: this._pad + tileH * 3,
        };

        // Remember where seat buttons should go.
        this._seatPos = {
            x: this._w,
            y: this._pad + tileH * 7 + this._pad,
            w: tileW * 6,
        };

        // Move next position.
        this._w += tileW * 6;
        this._nextX += tileW * 6 + this._pad;

        const placeWidgetAtTileIndex = (index, widget) => {
            assert(typeof index === "number");
            assert(widget instanceof Widget);

            const hex = MapStringHex.idxToHexString(index);
            const pos = Hex.toPosition(hex);
            const x = center.x + (pos.y * tileW) / 2 / Hex.HALF_SIZE;
            const y = center.y - (pos.x * tileW) / 2 / Hex.HALF_SIZE;
            this._canvas.addChild(widget, x, y, tileW, tileW); // tileW for height b/c transparent edges
            return widget;
        };

        const eqPositions = MiltyEqSliceLayout._getEqPositions();
        assert(Array.isArray(eqPositions));
        assert(eqPositions.length === eqs.length);
        eqs.forEach((tile, index) => {
            if (tile <= 0) {
                return;
            }
            const pos = eqPositions[index];
            const hex = Hex.fromPosition(pos);
            const mapStringIndex = MapStringHex.hexStringToIdx(hex);

            const system = world.TI4.getSystemByTileNumber(tile);
            const imgPath = system.raw.img;
            const img = new ImageWidget().setImage(imgPath, refPackageId);
            placeWidgetAtTileIndex(mapStringIndex, img);
        });

        world.TI4.getAllPlayerDesks().forEach((playerDesk) => {
            const anchorPos = MiltyEqSliceLayout._getAnchorPosition(
                playerDesk.index
            );

            const homeColor = playerDesk.widgetColor;
            const mutedColor = Color.lerp(homeColor, [0, 0, 0, 1], 0.5);
            const tilePosArray = MiltyEqSliceLayout._getTilePositions(
                anchorPos,
                undefined
            );
            tilePosArray.forEach((tilePos, index) => {
                const hex = Hex.fromPosition(tilePos);
                const img = new ImageWidget()
                    .setImage("global/ui/tiles/blank.png", refPackageId)
                    .setTintColor(index === 0 ? homeColor : mutedColor);
                const box = new LayoutBox().setChild(img);

                const mapStringIndex = MapStringHex.hexStringToIdx(hex);
                placeWidgetAtTileIndex(mapStringIndex, box);

                if (index === 0) {
                    const seatData = seatDataArray[playerDesk.index];
                    assert(seatData);

                    let label;
                    let fontSize;
                    if (seatData.orderIndex === 0) {
                        label = locale("ui.label.speaker").toUpperCase();
                        fontSize = 4;
                    } else {
                        label = `${seatData.orderIndex + 1}`;
                        fontSize = 8;
                    }

                    const text = new Text()
                        .setFontSize(this._scale * fontSize)
                        .setTextColor([0, 0, 0, 1])
                        .setBold(true)
                        .setText(label);
                    const box = new LayoutBox()
                        .setVerticalAlignment(VerticalAlignment.Center)
                        .setHorizontalAlignment(HorizontalAlignment.Center)
                        .setChild(text);
                    placeWidgetAtTileIndex(mapStringIndex, box);
                }
            });
        });

        return this;
    }

    addFactions(factionDataArray) {
        assert(Array.isArray(factionDataArray));
        factionDataArray.forEach((factionData) => {
            assert(typeof factionData.nsidName === "string");
            assert(typeof factionData.onClickedGenerator === "function");
        });

        const { sliceW } = this._sliceSize;
        const factionW = sliceW;
        const factionH =
            (this._h - (NUM_FACTION_ROWS + 1) * this._pad) / NUM_FACTION_ROWS;

        let row = 0;
        factionDataArray.forEach((factionData) => {
            // Grow when starting a new column.
            if (row === 0) {
                this._w += factionW + this._pad;
            }

            const offset = {
                x: this._nextX,
                y: this._pad + row * (factionH + this._pad),
            };

            // Push to next column for next when full.
            row = (row + 1) % NUM_FACTION_ROWS;
            if (row === 0) {
                this._nextX += factionW + this._pad;
            }

            const size = {
                w: factionW,
                h: factionH,
            };
            assert(typeof size.w === "number");
            assert(typeof size.h === "number");
            new FactionTokenUI(this._canvas, offset, size).setFaction(
                factionData.nsidName,
                factionData.onClickedGenerator
            );
        });

        // If stopped before finishing row still advance to next "column".
        if (row > 0) {
            this._nextX += factionW + this._pad;
            this._w = this._nextX;
        } else if (row === 0) {
            this._nextX += this._pad;
            this._w = this._nextX;
        }

        return this;
    }

    addSeats(seatDataArray) {
        assert(Array.isArray(seatDataArray));
        seatDataArray.forEach((seatData) => {
            assert(typeof seatData.deskIndex === "number");
            assert(typeof seatData.orderIndex === "number");
            assert(typeof seatData.onClickedGenerator === "function");
        });

        const { sliceW, tileH } = this._sliceSize;
        const seatW = sliceW;
        const seatH = tileH;
        const padLeft = (this._seatPos.w - this._pad - seatW * 2) / 2;

        seatDataArray.forEach((seatData, index) => {
            // Place in reserved area.

            // Use button positions approximating 6p map location.
            let col, row;
            switch (index) {
                case 0:
                    col = 1;
                    row = 1;
                    break;
                case 1:
                    col = 1;
                    row = 2;
                    break;
                case 2:
                    col = 0;
                    row = 2;
                    break;
                case 3:
                    col = 0;
                    row = 1;
                    break;
                case 4:
                    col = 0;
                    row = 0;
                    break;
                case 5:
                    col = 1;
                    row = 0;
                    break;
            }

            const offset = {
                x: this._seatPos.x + padLeft + col * (seatW + this._pad),
                y: this._seatPos.y + row * (seatH + this._pad),
            };

            new SeatTokenUI(this._canvas, offset, {
                w: seatW,
                h: seatH,
            }).setSeatIndex(
                seatData.deskIndex,
                seatData.orderIndex,
                seatData.onClickedGenerator
            );
        });

        return this;
    }
}

module.exports = { MiltyEqDraftUI };
