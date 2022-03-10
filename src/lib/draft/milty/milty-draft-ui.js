const assert = require("../../../wrapper/assert-wrapper");
const locale = require("../../locale");
const { ColorUtil } = require("../../color/color-util");
const { FactionTokenUI } = require("./faction-token-ui");
const { MiltySliceUI } = require("./milty-slice-ui");
const { SeatTokenUI } = require("./seat-token-ui");
const { Border, Button, Canvas } = require("../../../wrapper/api");

const NUM_SLICE_ROWS = 2;
const NUM_FACTION_ROWS = 4;
const NUM_SEAT_ROWS = 6;

/**
 * Strategy cards are using 833 width, follow that convention.
 *
 */
class MiltyDraftUI {
    constructor(scale) {
        assert(typeof scale === "number" && scale >= 1);

        this._canvas = new Canvas();
        this._scale = scale;
        this._sliceSize = MiltySliceUI.getSize(this._scale);
        this._pad = Math.floor(this._sliceSize.tileH / 3);

        // Fix height.
        const pad = this._pad;
        const sliceH = this._sliceSize.sliceH;
        this._h = pad + (sliceH + pad) * NUM_SLICE_ROWS;

        // Grow when adding things.
        this._nextX = pad;
        this._w = pad;
    }

    /**
     * Lock-in layout, return widget and size.
     *
     * @returns {Object.{widget:Widget,w:number,h:number}}
     */
    getWidgetAndSize(onFinishedButton) {
        assert(onFinishedButton instanceof Button);

        const { sliceW, tileH } = this._sliceSize;

        // Add button to the bottom
        const w = sliceW * 3 + this._pad * 2;
        const h = tileH;
        const x = (this._w - w) / 2;
        const y = this._h;
        this._canvas.addChild(onFinishedButton, x, y, w, h);
        this._h += tileH + this._pad;

        // Set it up here, as part of UI.
        const fontSize = Math.min(255, Math.floor(h * 0.3));
        onFinishedButton
            .setText(locale("ui.draft.button.finish"))
            .setFontSize(fontSize)
            .setEnabled(false);

        return {
            widget: new Border().setChild(this._canvas),
            w: this._w,
            h: this._h,
        };
    }

    addSlices(sliceDataArray) {
        assert(Array.isArray(sliceDataArray));
        sliceDataArray.forEach((sliceData) => {
            assert(Array.isArray(sliceData.slice));
            assert(ColorUtil.isColor(sliceData.color));
            assert(typeof sliceData.label === "string");
            assert(typeof sliceData.onClickedGenerator === "function");
        });

        const { sliceW, sliceH } = this._sliceSize;
        let row = 0;
        sliceDataArray.forEach((sliceData) => {
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

            new MiltySliceUI(this._canvas, offset, this._scale)
                .setSlice(sliceData.slice)
                .setColor(sliceData.color)
                .setLabel(sliceData.label, sliceData.onClickedGenerator);
        });

        // If stopped before finishing row still advance to next "column".
        if (row > 0) {
            this._nextX += sliceW + this._pad;
        }

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

            new FactionTokenUI(this._canvas, offset, {
                w: factionW,
                h: factionH,
            }).setFaction(factionData.nsidName, factionData.onClickedGenerator);
        });

        // If stopped before finishing row still advance to next "column".
        if (row > 0) {
            this._nextX += factionW + this._pad;
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

        const { sliceW } = this._sliceSize;
        const seatW = sliceW;
        const seatH =
            (this._h - (NUM_SEAT_ROWS + 1) * this._pad) / NUM_SEAT_ROWS;

        let row = 0;
        seatDataArray.forEach((seatData) => {
            // Grow when starting a new column.
            if (row === 0) {
                this._w += seatW + this._pad;
            }

            const offset = {
                x: this._nextX,
                y: this._pad + row * (seatH + this._pad),
            };

            // Push to next column for next when full.
            row = (row + 1) % NUM_SEAT_ROWS;
            if (row === 0) {
                this._nextX += seatW + this._pad;
            }

            new SeatTokenUI(this._canvas, offset, {
                w: seatW,
                h: seatH,
            }).setSeatIndex(
                seatData.deskIndex,
                seatData.orderIndex,
                seatData.onClickedGenerator
            );
        });

        // If stopped before finishing row still advance to next "column".
        if (row > 0) {
            this._nextX += seatW + this._pad;
        }

        return this;
    }
}

module.exports = { MiltyDraftUI };
