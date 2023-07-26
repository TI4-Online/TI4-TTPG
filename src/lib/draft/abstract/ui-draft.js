const assert = require("../../../wrapper/assert-wrapper");
const locale = require("../../locale");
const { AbstractUtil } = require("./abstract-util");
const { ColorUtil } = require("../../color/color-util");
const { ThrottleClickHandler } = require("../../ui/throttle-click-handler");
const { UiDraftChoice } = require("./ui-draft-choice");
const { UiFaction } = require("./ui-faction");
const { UiMap, ORDER_LABEL } = require("./ui-map");
const { UiSeat } = require("./ui-seat");
const { UiSlice } = require("./ui-slice");
const CONFIG = require("../../../game-ui/game-ui-config");
const {
    Border,
    Button,
    HorizontalBox,
    LayoutBox,
    Panel,
    Text,
    TextJustification,
    VerticalBox,
    globalEvents,
    world,
} = require("../../../wrapper/api");

const SPACING = 4;
const FONT_SIZE = 10;

const ROWS_SLICES = 3;
const ROWS_FACTIONS = 8;
const ROWS_SEATS = 8;

const COLORS = [
    "#F0F0F0", // white
    "#00CFFF", // blue
    "#572780", // purple
    "#D7B700", // yellow
    "#FF1010", // red
    "#00FF00", // green
    "#F46FCD", // pink
    "#FC6A03", // orange
];

class UiDraft {
    constructor(sliceDraft) {
        assert(sliceDraft);
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
        this._addSpacer(panel);

        this._addFactions(panel);
        this._addSpacer(panel);

        this._addSeats(panel);
        this._addSpacer(panel);

        this._addMap(panel);

        // Active turn indicator.
        const turn = new Text()
            .setFontSize(this._scale * FONT_SIZE)
            .setJustification(TextJustification.Center);
        const updateTurn = () => {
            const playerDesk = world.TI4.turns.getCurrentTurn();
            const playerSlot = playerDesk.playerSlot;
            const player = world.getPlayerBySlot(playerSlot);
            const playerName = player
                ? player.getName()
                : `"${playerDesk.colorName}"`;
            const msg = locale("ui.agenda.clippy.waiting_for_player_name", {
                playerName,
            });
            turn.setText(msg);
        };
        updateTurn();
        globalEvents.TI4.onTurnChanged.add(updateTurn);

        // Finish button below.
        const finish = new Button()
            .setFontSize(this._scale * FONT_SIZE)
            .setText(locale("ui.draft.finish_draft").toUpperCase());
        finish.onClicked.add(
            ThrottleClickHandler.wrap((button, player) => {
                this._sliceDraft.finish(player);
            })
        );

        const updateFinishEnabled = () => {
            finish.setEnabled(this._sliceDraft.isReadyToFinish());
        };

        updateFinishEnabled();
        this._sliceDraft.onChooserToggled.add(updateFinishEnabled);

        const overall = new VerticalBox()
            .setChildDistance(this._spacing)
            .addChild(panel)
            .addChild(turn)
            .addChild(finish);

        const overallBox = new LayoutBox()
            .setPadding(
                this._spacing,
                this._spacing,
                this._spacing,
                this._spacing
            )
            .setChild(overall);
        return new Border().setChild(overallBox);
    }

    _addSpacer(panel) {
        assert(panel instanceof Panel);

        const border = new Border().setColor(CONFIG.spacerColor);

        const box = new LayoutBox()
            .setOverrideWidth(this._spacing)
            .setChild(border);

        panel.addChild(box);
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
            const label = this._sliceDraft.getLabel(index);
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

            // Set owner if already selected (time rewind, script reload).
            const playerCount = world.TI4.config.playerCount;
            const sliceStr = slice.join(",");
            for (let chooser = 0; chooser < playerCount; chooser++) {
                const chooserSlice = this._sliceDraft.getChooserSlice(chooser);
                const chooserStr = chooserSlice ? chooserSlice.join(",") : "";
                if (chooserStr === sliceStr) {
                    uiChoice.setOwningDeskIndex(chooser);
                }
            }

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

            // Set owner if already selected (time rewind, script reload).
            const playerCount = world.TI4.config.playerCount;
            for (let chooser = 0; chooser < playerCount; chooser++) {
                const chooserFaction =
                    this._sliceDraft.getChooserFaction(chooser);
                if (chooserFaction === factionNsidName) {
                    uiChoice.setOwningDeskIndex(chooser);
                }
            }

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

            // Set owner if already selected (time rewind, script reload).
            for (let chooser = 0; chooser < playerCount; chooser++) {
                const chooserSeat =
                    this._sliceDraft.getChooserSeatIndex(chooser);
                if (chooserSeat === deskIndex) {
                    uiChoice.setOwningDeskIndex(chooser);
                }
            }

            const widget = uiChoice.createWidget();
            column.addChild(widget);
        }
    }
}

module.exports = { UiDraft };
