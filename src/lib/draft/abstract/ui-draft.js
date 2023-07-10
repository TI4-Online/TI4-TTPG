const assert = require("../../../wrapper/assert-wrapper");
const { AbstractSliceDraft } = require("./abstract-slice-draft");
const { AbstractUtil } = require("./abstract-util");
const { UiDraftChoice } = require("./ui-draft-choice");
const { UiSlice } = require("./ui-slice");
const {
    HorizontalBox,
    LayoutBox,
    VerticalBox,
    world,
} = require("../../../wrapper/api");
const { ColorUtil } = require("../../color/color-util");
const { UiMap } = require("./ui-map");

const SPACING = 4;

const ROWS_SLICES = 3;

const COLORS = [
    "#00FF00", // green
    "#FF1010", // red
    "#D7B700", // yellow
    "#F46FCD", // pink
    "#FC6A03", // orange
    "#572780", // purble
    "#00CFFF", // plue
    "#F0F0F0", // white
];

class UiDraft {
    constructor(sliceDraft) {
        assert(sliceDraft instanceof AbstractSliceDraft);
        this._sliceDraft = sliceDraft;

        this._scale = 1;
        this._spacing = Math.ceil(SPACING * this._scale);
    }

    setScale(scale) {
        assert(typeof scale === "number");
        this._scale = scale;
        this._spacing = Math.ceil(SPACING * this._scale);
        return this;
    }

    createWidget() {
        const sliceBox = new LayoutBox();
        this._addSlices(sliceBox);

        const mapBox = new LayoutBox();
        this._addMap(mapBox);

        return new HorizontalBox()
            .setChildDistance(this._spacing)
            .addChild(sliceBox)
            .addChild(mapBox);
    }

    _addSlices(layoutBox) {
        assert(layoutBox instanceof LayoutBox);

        const slices = this._sliceDraft.getSlices();
        const shape = this._sliceDraft.getSliceGenerator().getSliceShape();
        AbstractUtil.assertIsSliceArray(slices, shape);

        // Create overall layout and individual rows.
        const overallPanel = new VerticalBox().setChildDistance(this._spacing);
        layoutBox.setChild(overallPanel);
        const numCols = Math.ceil(slices.length / ROWS_SLICES);
        const numRows = Math.ceil(slices.length / numCols);
        const rowPanels = [];
        for (let i = 0; i < numRows; i++) {
            const rowPanel = new HorizontalBox().setChildDistance(
                this._spacing
            );
            rowPanels.push(rowPanel);
            overallPanel.addChild(rowPanel);
        }

        for (let index = 0; index < slices.length; index++) {
            const slice = slices[index];
            const color = ColorUtil.colorFromHex(COLORS[index]);
            const label = `SLICE ${"ABCDEFGHIJKLMOPQRSTUVWXYZ"[index]}`;
            const row = Math.floor(index / numCols);
            console.log(`xxx slice [${slice.join(", ")}] ${label} row ${row}`);
            const rowPanel = rowPanels[row];
            const uiSlice = new UiSlice()
                .setScale(this._scale)
                .setShape(shape)
                .setSlice(slice)
                .setHomeSystemColor(color)
                .setLabel(label);
            const uiChoice = new UiDraftChoice(uiSlice)
                .setScale(this._scale)
                .setAllowToggle((uiChoice, playerSlot) => {
                    const player = world.getPlayerBySlot(playerSlot);
                    const success = this._sliceDraft.attemptToggleSlice(
                        player,
                        slice
                    );
                    console.log(`UiDraft toggle slice success=${success}`);
                    return success;
                });
            const widget = uiChoice.createWidget();
            rowPanel.addChild(widget);
        }
    }

    _addMap(layoutBox) {
        assert(layoutBox instanceof LayoutBox);

        const includeHomeSystems = true;
        const { mapString, deskIndexToLabel } = UiMap.generateMapString(
            this._sliceDraft,
            includeHomeSystems
        );

        const uiMap = new UiMap()
            .setScale(this._scale)
            .setSpeakerIndex(this._sliceDraft.getSpeakerIndex())
            .setMapString(mapString)
            .setMultipleLabels(deskIndexToLabel);
        const widget = uiMap.createWidget();
        layoutBox.setChild(widget);
    }

    _addSeats(layoutBox) {
        assert(layoutBox instanceof LayoutBox);
    }

    _addFactions(layoutBox) {
        assert(layoutBox instanceof LayoutBox);
    }
}

module.exports = { UiDraft };
