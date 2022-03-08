const assert = require("../../../wrapper/assert-wrapper");
const { MiltySliceUI } = require("./milty-slice-ui");
const {
    Border,
    Canvas,
    Color,
    LayoutBox,
    refPackageId,
    world,
} = require("../../../wrapper/api");

const OVERALL_WIDTH = 833;
const OVERALL_HEIGHT = 310;
const PADDING = 10;

/**
 * Strategy cards are using 833 width, follow that convention.
 *
 */
class MiltyDraftUI {
    static getSize(scale) {
        const pad = Math.floor(PADDING * scale);
        const [sliceW, sliceH] = MiltySliceUI.getSize(scale);
        const w = sliceW * 6 + pad * 7;
        const h = sliceH * 3 + pad * 4;
        return [w, h];
    }

    constructor(canvas, canvasOffset, scale) {
        assert(canvas instanceof Canvas);
        assert(typeof canvasOffset.x === "number");
        assert(typeof canvasOffset.y === "number");
        assert(typeof scale === "number" && scale >= 1);

        const playerCount = world.TI4.config.playerCount;
        const halfPlayerCount = Math.ceil(playerCount / 2);
        const pad = Math.floor(PADDING * scale);
        const [w, h] = MiltyDraftUI.getSize(scale);
        const [sliceW, sliceH] = MiltySliceUI.getSize(scale);
        const factionW = sliceW;
        const factionH = (sliceH - pad) / 2;
        const seatW =
            (sliceW * 3 + pad * 2 - (halfPlayerCount - 1) * pad) /
            halfPlayerCount;
        const seatH = factionH;

        // Fill background.
        canvas.addChild(new Border(), canvasOffset.x, canvasOffset.y, w, h);

        const sliceOrigin = { x: pad, y: pad };
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
                x: canvasOffset.x + sliceOrigin.x + offset.x * (sliceW + pad),
                y: canvasOffset.y + sliceOrigin.y + offset.y * (sliceH + pad),
            };
        });
        this._miltySliceUIs = sliceOffsets.map((sliceOffset) => {
            return new MiltySliceUI(canvas, sliceOffset, scale);
        });

        const factionOrigin = { x: pad + (sliceW + pad) * 3, y: pad };
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
                    offset.x * (factionW + pad),
                y:
                    canvasOffset.y +
                    factionOrigin.y +
                    offset.y * (factionH + pad),
            };
        });
        this._factionBoxes = factionOffsets.map((factionOffset) => {
            const factionBox = new LayoutBox().setChild(
                new Border().setColor([1, 1, 1])
            );
            canvas.addChild(
                factionBox,
                factionOffset.x,
                factionOffset.y,
                factionW,
                factionH
            );
            return factionBox;
        });

        const seatOrigin = {
            x: pad + (sliceW + pad) * 3,
            y: pad + (factionH + pad) * 4,
        };
        const seatOffsets = [...Array(playerCount).keys()].map((index) => {
            const col = index % halfPlayerCount;
            const row = Math.floor(index / halfPlayerCount);
            return {
                x: canvasOffset.x + seatOrigin.x + col * (seatW + pad),
                y: canvasOffset.y + seatOrigin.y + row * (seatH + pad),
            };
        });
        this._seatBoxes = seatOffsets.map((seatOffset) => {
            const seatBox = new LayoutBox().setChild(
                new Border().setColor([1, 1, 1])
            );
            canvas.addChild(seatBox, seatOffset.x, seatOffset.y, seatW, seatH);
            return seatBox;
        });

        const miltySliceString = "1 2 3 4 5";
        const color = new Color(1, 0, 0);
        const label = "Test Longer Slice Name";
        for (const miltySliceUI of this._miltySliceUIs) {
            miltySliceUI.setSlice(miltySliceString, color, label);
        }
    }

    setSlices(miltySlices) {
        assert(Array.isArray(miltySlices));
        // XXX TODO
    }

    setFactions(factionNames) {
        assert(Array.isArray(factionNames));
        // XXX TODO
    }
}

module.exports = { MiltyDraftUI };
