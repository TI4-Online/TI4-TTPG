const assert = require("../../../wrapper/assert-wrapper");
const { ColorUtil } = require("../../color/color-util");
const { FactionTokenUI } = require("./faction-token-ui");
const { MiltySliceUI } = require("./milty-slice-ui");
const { SeatTokenUI } = require("./seat-token-ui");
const { Border, Canvas, world } = require("../../../wrapper/api");

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
        const fontSize = MiltySliceUI.getFontSize(scale);

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
            return new FactionTokenUI(
                canvas,
                factionOffset,
                {
                    w: factionW,
                    h: factionH,
                },
                fontSize
            );
        });

        const seatOrigin = {
            x: padW + (sliceW + padW) * 3,
            y: padH + (factionH + padH) * 4,
        };
        const seatOffsets = [...Array(playerCount).keys()].map((index) => {
            const row = index < halfPlayerCount ? 1 : 0;
            let col = index % halfPlayerCount;
            if (row === 1) {
                col = halfPlayerCount - col - 1;
            }
            return {
                x: canvasOffset.x + seatOrigin.x + col * (seatW + padW),
                y: canvasOffset.y + seatOrigin.y + row * (seatH + padH),
            };
        });
        this._seatTokenUIs = seatOffsets.map((seatOffset) => {
            return new SeatTokenUI(canvas, seatOffset, { w: seatW, h: seatH });
        });
        const playerDesks = world.TI4.getAllPlayerDesks();
        for (let i = 0; i < this._seatTokenUIs.length; i++) {
            const seatTokenUI = this._seatTokenUIs[i];
            const playerDesk = playerDesks[i];
            assert(playerDesk);
            seatTokenUI.setColor(playerDesk.color);
        }
    }

    setSlices(miltySlices) {
        assert(Array.isArray(miltySlices));
        miltySlices.forEach((miltySlice) => {
            assert(Array.isArray(miltySlice.slice));
            assert(ColorUtil.isColor(miltySlice.color));
            assert(typeof miltySlice.label === "string");
        });
        for (let i = 0; i < this._miltySliceUIs.length; i++) {
            const miltySliceUI = this._miltySliceUIs[i];
            const miltySlice = miltySlices[i];
            if (miltySlice) {
                miltySliceUI.setSlice(miltySlice.slice);
                miltySliceUI.setColor(miltySlice.color);
                miltySliceUI.setLabel(miltySlice.label);
            } else {
                miltySliceUI.clear();
            }
        }
        return this;
    }

    setFactions(factionNsidNames) {
        assert(Array.isArray(factionNsidNames));
        for (let i = 0; i < this._factionTokenUIs.length; i++) {
            const factionTokenUI = this._factionTokenUIs[i];
            const factionNsidName = factionNsidNames[i];
            if (factionNsidName) {
                factionTokenUI.setFaction(factionNsidName);
            } else {
                factionTokenUI.clear();
            }
        }
        return this;
    }

    setSpeakerSeatIndex(speakerSeatIndex) {
        assert(typeof speakerSeatIndex === "number");
        for (let i = 0; i < this._seatTokenUIs.length; i++) {
            const seatTokenUI = this._seatTokenUIs[i];
            let orderIndex = i - speakerSeatIndex;
            if (orderIndex < 0) {
                orderIndex += this._seatTokenUIs.length;
            }
            seatTokenUI.setSeatIndex(orderIndex);
        }
        return this;
    }
}

module.exports = { MiltyDraftUI };
