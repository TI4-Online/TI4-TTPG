const assert = require("../../../wrapper/assert-wrapper");
const locale = require("../../locale");
const { AbstractSliceDraft } = require("./abstract-slice-draft");
const { AbstractUtil } = require("./abstract-util");
const { ColorUtil } = require("../../color/color-util");
const { UiDraftChoice } = require("./ui-draft-choice");
const { UiFaction } = require("./ui-faction");
const { UiMap, ORDER_LABEL } = require("./ui-map");
const { UiSeat } = require("./ui-seat");
const { UiSlice } = require("./ui-slice");
const {
    Border,
    Button,
    HorizontalBox,
    LayoutBox,
    Panel,
    VerticalBox,
    world,
} = require("../../../wrapper/api");

const SPACING = 4;
const FONT_SIZE = 10;

const ROWS_SLICES = 2;
const ROWS_FACTIONS = 6;
const ROWS_SEATS = 6;

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
        // Draft selections in a row.
        const panel = new HorizontalBox().setChildDistance(this._spacing);

        this._addSlices(panel);
        panel.addChild(new Border().setColor([0, 0, 0, 1]));

        this._addFactions(panel);
        panel.addChild(new Border().setColor([0, 0, 0, 1]));

        this._addMap(panel);
        panel.addChild(new Border().setColor([0, 0, 0, 1]));

        this._addSeats(panel);

        // Finish button below.
        const finish = new Button()
            .setFontSize(this._scale * FONT_SIZE)
            .setText(locale("ui.draft.finish_draft"));

        finish.setEnabled(false);
        this._sliceDraft.onChooserToggled.add(() => {
            finish.setEnabled(false);
            const playerCount = world.TI4.config.playerCount;
            for (let chooser = 0; chooser < playerCount; chooser++) {
                if (this._sliceDraft.getChooserSlice(chooser) === undefined) {
                    return;
                }
                if (this._sliceDraft.getChooserFaction(chooser) === undefined) {
                    return;
                }
                if (
                    this._sliceDraft.getChooserSeatIndex(chooser) === undefined
                ) {
                    return;
                }
                finish.setEnabled(true);
            }
        });

        return new VerticalBox()
            .setChildDistance(this._spacing)
            .addChild(panel)
            .addChild(finish);
    }

    _addSlices(panel) {
        assert(panel instanceof Panel);

        const slices = this._sliceDraft.getSlices();
        const shape = this._sliceDraft.getSliceGenerator().getSliceShape();
        AbstractUtil.assertIsSliceArray(slices, shape);

        let column = new VerticalBox();

        for (let index = 0; index < slices.length; index++) {
            if (index % ROWS_SLICES === 0) {
                column = new VerticalBox().setChildDistance(this._spacing);
                panel.addChild(column);
            }

            const slice = slices[index];
            const color = ColorUtil.colorFromHex(COLORS[index]);
            const label = `SLICE ${"ABCDEFGHIJKLMOPQRSTUVWXYZ"[index]}`;
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
            column.addChild(widget);
        }
    }

    _addMap(panel) {
        assert(panel instanceof Panel);

        const layoutBox = new LayoutBox();
        panel.addChild(layoutBox);

        const resetMapWidget = () => {
            const options = { includeHomeSystems: true };
            const { mapString, deskIndexToLabel } = UiMap.generateMapString(
                this._sliceDraft,
                options
            );

            const uiMap = new UiMap()
                .setScale(this._scale)
                .setSpeakerIndex(this._sliceDraft.getSpeakerIndex())
                .setMapString(mapString)
                .setMultipleLabels(deskIndexToLabel);
            const widget = uiMap.createWidget();
            layoutBox.setChild(widget);
        };

        resetMapWidget();
        this._sliceDraft.onChooserToggled.add(resetMapWidget);
    }

    _addFactions(panel) {
        assert(panel instanceof Panel);

        const factionNsidNames = this._sliceDraft.getFactionNsidNames();
        let column;

        for (let index = 0; index < factionNsidNames.length; index++) {
            if (index % ROWS_FACTIONS === 0) {
                column = new VerticalBox().setChildDistance(this._spacing);
                panel.addChild(column);
            }

            const factionNsidName = factionNsidNames[index];
            const uiFaction = new UiFaction()
                .setScale(this._scale)
                .setFactionNsidName(factionNsidName);
            const uiChoice = new UiDraftChoice(uiFaction)
                .setScale(this._scale)
                .setAllowToggle((uiChoice, playerSlot) => {
                    const player = world.getPlayerBySlot(playerSlot);
                    const success = this._sliceDraft.attemptToggleFaction(
                        player,
                        factionNsidName
                    );
                    console.log(`UiDraft toggle faction success=${success}`);
                    return success;
                });
            const widget = uiChoice.createWidget();
            column.addChild(widget);
        }
    }

    _addSeats(panel) {
        assert(panel instanceof Panel);

        const playerCount = world.TI4.config.playerCount;
        let column;

        const playerDesks = world.TI4.getAllPlayerDesks();
        const speakerIndex = this._sliceDraft.getSpeakerIndex();
        for (let deskIndex = 0; deskIndex < playerCount; deskIndex++) {
            if (deskIndex % ROWS_SEATS === 0) {
                column = new VerticalBox().setChildDistance(this._spacing);
                panel.addChild(column);
            }

            const playerDesk = playerDesks[deskIndex];
            const order =
                (deskIndex - speakerIndex + playerCount) % playerCount;
            const label = ORDER_LABEL[order];
            const uiSeat = new UiSeat()
                .setScale(this._scale)
                .setLabel(label)
                .setColor(playerDesk.widgetColor);
            const uiChoice = new UiDraftChoice(uiSeat)
                .setScale(this._scale)
                .setAllowToggle((uiChoice, playerSlot) => {
                    const player = world.getPlayerBySlot(playerSlot);
                    const success = this._sliceDraft.attemptToggleSeatIndex(
                        player,
                        deskIndex
                    );
                    console.log(`UiDraft toggle seat index success=${success}`);
                    return success;
                });
            const widget = uiChoice.createWidget();
            column.addChild(widget);
        }
    }
}

module.exports = { UiDraft };
