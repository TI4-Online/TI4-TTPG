const assert = require("../../../wrapper/assert-wrapper");
const locale = require("../../locale");
const { ColorUtil } = require("../../color/color-util");
const { FactionTokenUI } = require("./faction-token-ui");
const { MiltySliceUI } = require("./milty-slice-ui");
const { SeatTokenUI } = require("./seat-token-ui");
const CONFIG = require("../../../game-ui/game-ui-config");
const {
    Border,
    Button,
    Canvas,
    HorizontalAlignment,
    LayoutBox,
    Text,
    VerticalAlignment,
    world,
} = require("../../../wrapper/api");

const NUM_SLICE_ROWS = 2;
const NUM_FACTION_ROWS = 4;
const NUM_SEAT_ROWS = 6;

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

/**
 * Strategy cards are using 833 width, follow that convention.
 */
class MiltyDraftUI {
    constructor(playerDesk, scale) {
        assert(playerDesk);
        assert(typeof scale === "number" && scale >= 1);

        this._playerDesk = playerDesk;
        this._scale = scale;
        this._canvas = new Canvas();
        this._sliceSize = MiltySliceUI.getSize(this._scale);
        this._pad = Math.floor(this._sliceSize.tileH / 3);

        this._waitingFor = new Text().setText("<>");

        // Fix height.
        const pad = this._pad;
        const sliceH = this._sliceSize.sliceH;
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

            new MiltySliceUI(this._canvas, offset, this._scale)
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
