const assert = require("../../../wrapper/assert-wrapper");
const { FactionTokenUI } = require("./faction-token-ui");
const { MiltySliceUI } = require("./milty-slice-ui");
const { SeatTokenUI } = require("./seat-token-ui");
const { Border, Canvas, Color, world } = require("../../../wrapper/api");

const PADDING = 10;

/**
 * Strategy cards are using 833 width, follow that convention.
 *
 */
class MiltyDraftUI {
    static getSize(scale) {
        assert(typeof scale === "number" && scale >= 1);
        const padW = Math.floor(PADDING * scale);
        const padH = Math.floor(PADDING * scale);
        const [sliceW, sliceH] = MiltySliceUI.getSize(scale);
        const w = sliceW * 6 + padW * 7;
        const h = sliceH * 3 + padH * 4;
        return [w, h];
    }

    constructor(canvas, canvasOffset, scale) {
        assert(canvas instanceof Canvas);
        assert(typeof canvasOffset.x === "number");
        assert(typeof canvasOffset.y === "number");
        assert(typeof scale === "number" && scale >= 1);

        const playerCount = world.TI4.config.playerCount;
        const halfPlayerCount = Math.ceil(playerCount / 2);

        const padW = Math.floor(PADDING * scale);
        const padH = Math.floor(PADDING * scale);

        const [w, h] = MiltyDraftUI.getSize(scale);
        const [sliceW, sliceH] = MiltySliceUI.getSize(scale);
        const factionW = sliceW;
        const factionH = (sliceH - padH) / 2;
        const seatW =
            (sliceW * 3 + padW * 2 - (halfPlayerCount - 1) * padW) /
            halfPlayerCount;
        const seatH = factionH;

        // Fill background.
        canvas.addChild(new Border(), canvasOffset.x, canvasOffset.y, w, h);

        const sliceOrigin = { x: padW, y: padH };
        const sliceOffsets = [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 2, y: 0 },
            { x: 0, y: 1 },
            { x: 1, y: 1 },
            { x: 2, y: 1 },
            { x: 0, y: 2 },
            { x: 1, y: 2 },
            { x: 2, y: 2 },
        ].map((offset) => {
            return {
                x: canvasOffset.x + sliceOrigin.x + offset.x * (sliceW + padW),
                y: canvasOffset.y + sliceOrigin.y + offset.y * (sliceH + padH),
            };
        });
        this._miltySliceUIs = sliceOffsets.map((sliceOffset) => {
            return new MiltySliceUI(canvas, sliceOffset, scale);
        });

        const factionOrigin = { x: padW + (sliceW + padW) * 3, y: padH };
        const factionOffsets = [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 2, y: 0 },
            { x: 0, y: 1 },
            { x: 1, y: 1 },
            { x: 2, y: 1 },
            { x: 0, y: 2 },
            { x: 1, y: 2 },
            { x: 2, y: 2 },
            { x: 0, y: 3 },
            { x: 1, y: 3 },
            { x: 2, y: 3 },
        ].map((offset) => {
            return {
                x:
                    canvasOffset.x +
                    factionOrigin.x +
                    offset.x * (factionW + padW),
                y:
                    canvasOffset.y +
                    factionOrigin.y +
                    offset.y * (factionH + padH),
            };
        });
        this._factionTokenUIs = factionOffsets.map((factionOffset) => {
            return new FactionTokenUI(canvas, factionOffset, {
                w: factionW,
                h: factionH,
            });
        });

        const seatOrigin = {
            x: padW + (sliceW + padW) * 3,
            y: padH + (factionH + padH) * 4,
        };
        const seatOffsets = [...Array(playerCount).keys()].map((index) => {
            const col = index % halfPlayerCount;
            const row = Math.floor(index / halfPlayerCount);
            return {
                x: canvasOffset.x + seatOrigin.x + col * (seatW + padW),
                y: canvasOffset.y + seatOrigin.y + row * (seatH + padH),
            };
        });
        this._seatTokenUIs = seatOffsets.map((seatOffset) => {
            return new SeatTokenUI(canvas, seatOffset, { w: seatW, h: seatH });
        });

        const miltySliceString = "1 2 3 4 5";
        const color = new Color(1, 0, 0);
        const label = "Test Longer Slice Name";
        for (const miltySliceUI of this._miltySliceUIs) {
            miltySliceUI.setSlice(miltySliceString, color, label);
        }
        for (const factionTokenUI of this._factionTokenUIs) {
            factionTokenUI.setFaction("arborec");
        }
        for (const SeatTokenUI of this._seatTokenUIs) {
            SeatTokenUI.setSeatIndex(1);
        }
    }

    setSlices(miltySlices) {
        assert(Array.isArray(miltySlices));
        // XXX TODO
    }

    setFactions(factionNsidNames) {
        assert(Array.isArray(factionNsidNames));
        // XXX TODO
    }
}

module.exports = { MiltyDraftUI };
