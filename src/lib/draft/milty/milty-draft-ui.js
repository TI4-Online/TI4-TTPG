const assert = require("../../../wrapper/assert-wrapper");
const { ColorUtil } = require("../../color/color-util");
const { FactionTokenUI } = require("./faction-token-ui");
const { MiltySliceUI } = require("./milty-slice-ui");
const { SeatTokenUI } = require("./seat-token-ui");
const { Canvas } = require("../../../wrapper/api");

const NUM_SLICE_ROWS = 2;
const NUM_FACTION_ROWS = 5;
const NUM_SEAT_ROWS = 6;

/**
 * Strategy cards are using 833 width, follow that convention.
 *
 */
class MiltyDraftUI {
    constructor(canvas, scale) {
        assert(canvas instanceof Canvas);
        assert(typeof scale === "number" && scale >= 1);

        this._canvas = canvas;
        this._scale = scale;
        this._sliceSize = MiltySliceUI.getSize(this._scale);
        this._pad = Math.floor(this._sliceSize.tileH / 2);

        // Fix height.
        const pad = this._pad;
        const sliceH = this._sliceSize.sliceH;
        this._h = pad + (sliceH + pad) * NUM_SLICE_ROWS;

        // Grow when adding things.
        this._nextX = pad;
        this._w = pad;
    }

    getSize() {
        return [this._w, this._h];
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
            assert(typeof seatData.orderIndex === "number");
            assert(typeof seatData.onClickedGenerator === "function");
        });

        const count = seatDataArray.length;
        const { sliceW } = this._sliceSize;
        const seatW = sliceW;
        const seatH = (this._h - (count + 1) * this._pad) / count;

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
            }).setSeatIndex(seatData.orderIndex, seatData.onClickedGenerator);
        });

        // If stopped before finishing row still advance to next "column".
        if (row > 0) {
            this._nextX += seatW + this._pad;
        }

        return this;
    }
}

module.exports = { MiltyDraftUI };
