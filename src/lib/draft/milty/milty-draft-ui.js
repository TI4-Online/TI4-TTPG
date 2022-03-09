const assert = require("../../../wrapper/assert-wrapper");
const { ColorUtil } = require("../../color/color-util");
const { FactionTokenUI } = require("./faction-token-ui");
const { MiltySliceUI } = require("./milty-slice-ui");
const { SeatTokenUI } = require("./seat-token-ui");
const { Border, Canvas, world } = require("../../../wrapper/api");

const NUM_SLICE_ROWS = 2;
const NUM_FACTION_ROWS = 5;
const NUM_SEAT_ROWS = 6;
const PADDING = 10;

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
        this._pad = Math.floor(PADDING * scale);

        // Fix height.
        const sliceH = MiltySliceUI.getSize(this._scale)[1];
        this._h = this._pad + (sliceH + this._pad) * NUM_SLICE_ROWS;

        // Grow when adding things.
        this._nextX = this._pad;
        this._w = this._pad;
    }

    getSize() {
        return [this._w, this._h];
    }

    addSlices(slices) {
        assert(Array.isArray(slices));
        slices.forEach((slice) => {
            assert(Array.isArray(slice.slice));
            assert(ColorUtil.isColor(slice.color));
            assert(typeof slice.label === "string");
        });

        const [sliceW, sliceH] = MiltySliceUI.getSize(this._scale);
        let row = 0;
        for (let i = 0; i < slices.length; i++) {
            const slice = slices[i];

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

            const onClicked = (button, player) => {};
            new MiltySliceUI(this._canvas, offset, this._scale, onClicked)
                .setSlice(slice.slice)
                .setColor(slice.color)
                .setLabel(slice.label);
        }

        // If stopped before finishing row still advance to next "column".
        if (row > 0) {
            this._nextX += sliceW + this._pad;
        }

        return this;
    }

    addFactions(factionNsidNames) {
        assert(Array.isArray(factionNsidNames));
        factionNsidNames.forEach((factionNsidName) => {
            assert(typeof factionNsidName === "string");
        });

        const factionW = MiltySliceUI.getSize(this._scale)[0];
        const factionH =
            (this._h - (NUM_FACTION_ROWS + 1) * this._pad) / NUM_FACTION_ROWS;

        let row = 0;
        for (let i = 0; i < factionNsidNames.length; i++) {
            const factionNsidName = factionNsidNames[i];

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

            const onClicked = (button, player) => {};
            new FactionTokenUI(
                this._canvas,
                offset,
                { w: factionW, h: factionH },
                onClicked
            ).setFaction(factionNsidName);
        }

        // If stopped before finishing row still advance to next "column".
        if (row > 0) {
            this._nextX += factionW + this._pad;
        }

        return this;
    }

    addSeats(speakerSeatIndex) {
        assert(typeof speakerSeatIndex === "number");

        const playerCount = world.TI4.config.playerCount;

        const seatW = MiltySliceUI.getSize(this._scale)[0];
        const seatH = (this._h - (playerCount + 1) * this._pad) / playerCount;

        let row = 0;
        for (let i = 0; i < playerCount; i++) {
            let orderIndex = i - speakerSeatIndex;
            if (orderIndex < 0) {
                orderIndex += playerCount;
            }

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

            const onClicked = (button, player) => {};
            new SeatTokenUI(
                this._canvas,
                offset,
                { w: seatW, h: seatH },
                onClicked
            ).setSeatIndex(orderIndex);
        }

        // If stopped before finishing row still advance to next "column".
        if (row > 0) {
            this._nextX += seatW + this._pad;
        }

        return this;
    }
}

module.exports = { MiltyDraftUI };
