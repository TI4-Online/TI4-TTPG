const assert = require("../../../wrapper/assert-wrapper");
const locale = require("../../locale");
const { AbstractSliceDraft } = require("./abstract-slice-draft");
const { ThrottleClickHandler } = require("../../ui/throttle-click-handler");
const { UiMap } = require("./ui-map");
const CONFIG = require("../../../game-ui/game-ui-config");
const {
    Border,
    Button,
    CheckBox,
    HorizontalAlignment,
    HorizontalBox,
    LayoutBox,
    Slider,
    Text,
    TextBox,
    TextJustification,
    VerticalAlignment,
    VerticalBox,
    world,
} = require("../../../wrapper/api");

class UiDraftSettings {
    static _createCheckbox(params) {
        assert(typeof params.name === "string");
        assert(typeof params.default === "boolean");
        assert(typeof params.onCheckStateChanged === "function");

        const checkBox = new CheckBox()
            .setFontSize(CONFIG.fontSize)
            .setText(params.name)
            .setIsChecked(params.default);
        checkBox.onCheckStateChanged.add(params.onCheckStateChanged);
        return checkBox;
    }

    static _createSlider(params) {
        assert(typeof params.name === "string");
        assert(typeof params.min === "number");
        assert(typeof params.max === "number");
        assert(typeof params.default === "number");
        assert(typeof params.onValueChanged === "function");

        assert(params.min <= params.max);
        assert(params.min <= params.default && params.default <= params.max);

        const label = new Text()
            .setFontSize(CONFIG.fontSize)
            .setText(params.name);
        const slider = new Slider()
            .setFontSize(CONFIG.fontSize)
            .setTextBoxWidth(CONFIG.fontSize * 4)
            .setMinValue(params.min)
            .setMaxValue(params.max)
            .setStepSize(params.stepSize || 1)
            .setValue(params.default);
        slider.onValueChanged.add(params.onValueChanged);
        const panel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(label, 1)
            .addChild(slider, 1);
        return panel;
    }

    constructor(sliceDraft) {
        assert(sliceDraft instanceof AbstractSliceDraft);
        this._sliceDraft = sliceDraft;
    }

    getWidget() {
        // Max player count?
        const playerCount = world.TI4.config.playerCount;
        const maxPlayerCount = this._sliceDraft.getMaxPlayerCount();
        if (playerCount > maxPlayerCount) {
            return this._getTooManyPlayersWidget();
        }

        // Place sliders/checkboxes and map in same row.
        const slidersAndCheckboxes = new VerticalBox().setChildDistance(
            CONFIG.spacing
        );
        this._addSliders(slidersAndCheckboxes);
        this._addCheckboxes(slidersAndCheckboxes);

        const spacer = new Border().setColor(CONFIG.spacerColor);

        const mapPanel = new VerticalBox().setChildDistance(CONFIG.spacing);
        this._addMap(mapPanel);

        const topRow = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(slidersAndCheckboxes, 2)
            .addChild(spacer)
            .addChild(mapPanel, 1);

        const panel = new VerticalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(topRow);

        this._addCustomConfig(panel);

        this._addStartButton(panel);

        // Alt UI for draft in progress.

        const swapBox = new LayoutBox();

        const setAppropriateWidget = () => {
            if (this._sliceDraft.isDraftInProgress()) {
                swapBox.setChild(this._getDraftInProgressWidget());
            } else {
                swapBox.setChild(panel);
            }
        };
        setAppropriateWidget();
        this._sliceDraft.onDraftStateChanged.add(setAppropriateWidget);

        return swapBox;
    }

    _getDraftInProgressWidget() {
        const label = new Text()
            .setFontSize(CONFIG.fontSize)
            .setJustification(TextJustification.Center)
            .setText(locale("ui.draft.in_progress"));

        const labelBox = new LayoutBox()
            .setVerticalAlignment(VerticalAlignment.Center)
            .setChild(label);

        const cancel = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.cancel"));
        cancel.onClicked.add(
            ThrottleClickHandler.wrap((button, player) => {
                this._sliceDraft.cancel(player);
            })
        );

        const panel = new VerticalBox()
            .addChild(labelBox, 1)
            .addChild(cancel, 0);

        return panel;
    }

    _getTooManyPlayersWidget() {
        const playerCount = world.TI4.config.playerCount;
        const msg = locale("ui.draft.too_many_players", { playerCount });
        return new Text()
            .setAutoWrap(true)
            .setFontSize(CONFIG.fontSize)
            .setText(msg);
    }

    _addSliders(panel) {
        // Slice count.
        const sliceGenerator = this._sliceDraft.getSliceGenerator();
        const sliceCount = UiDraftSettings._createSlider({
            name: locale("ui.draft.slice_count"),
            min: sliceGenerator.getMinCount(),
            max: sliceGenerator.getMaxCount(),
            default: sliceGenerator.getDefaultCount(),
            onValueChanged: () => {},
        });
        panel.addChild(sliceCount);

        // Faction count.
        const factionGenerator = this._sliceDraft.getFactionGenerator();
        const factionCount = UiDraftSettings._createSlider({
            name: locale("ui.draft.faction_count"),
            min: factionGenerator.getMinCount(),
            max: factionGenerator.getMaxCount(),
            default: factionGenerator.getDefaultCount(),
            onValueChanged: () => {},
        });
        panel.addChild(factionCount);

        // Add custom sliders AFTER default ones.
        for (const params of this._sliceDraft.getCustomSliders()) {
            const slider = UiDraftSettings._createSlider(params);
            panel.addChild(slider);
        }
    }

    _addCheckboxes(panel) {
        // Add custom checkboxes BEFORE default ones.
        for (const params of this._sliceDraft.getCustomCheckBoxes()) {
            const checkBox = UiDraftSettings._createCheckbox(params);
            panel.addChild(checkBox);
        }

        // Use faction cards on table?
        const useFactionsOnTable = UiDraftSettings._createCheckbox({
            name: locale("ui.draft.factions_from_cards_short"),
            default: false,
            onCheckStateChanged: () => {},
        });
        panel.addChild(useFactionsOnTable);
    }

    _addCustomConfig(panel) {
        const customConfigLabel = new Text()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.draft.custom_input"));
        panel.addChild(customConfigLabel);

        const customConfigText = new TextBox()
            .setFontSize(CONFIG.fontSize)
            .setMaxLength(1023);
        panel.addChild(customConfigText);
        customConfigText.onTextCommitted.add(
            (textBox, player, text, usingEnter) => {
                this._sliceDraft.setCustomInput(text);
            }
        );
    }

    _addStartButton(panel) {
        // Force start button to bottom.
        panel.addChild(new LayoutBox(), 1);

        const startButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.draft.start_draft").toUpperCase());
        panel.addChild(startButton);
        startButton.onClicked.add((button, player) => {
            this._sliceDraft.start(player);
        });
    }

    _addMap(panel) {
        const options = { includeHomeSystems: false };
        const { mapString } = UiMap.generateMapString(
            this._sliceDraft,
            options
        );
        const map = new UiMap()
            .setMapString(mapString)
            .setScale(1.5)
            .createWidget();

        const mapBox = new LayoutBox()
            .setHorizontalAlignment(HorizontalAlignment.Center)
            .setVerticalAlignment(VerticalAlignment.Top)
            .setChild(map);

        panel.addChild(mapBox);
    }
}

module.exports = { UiDraftSettings };
