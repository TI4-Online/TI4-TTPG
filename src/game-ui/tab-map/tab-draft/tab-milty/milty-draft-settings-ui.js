const assert = require("../../../../wrapper/assert-wrapper");
const locale = require("../../../../lib/locale");
const {
    MiltyFactionGenerator,
} = require("../../../../lib/draft/milty/milty-faction-generator");
const {
    MiltySliceGenerator,
} = require("../../../../lib/draft/milty/milty-slice-generator");
const CONFIG = require("../../../game-ui-config");
const {
    Button,
    CheckBox,
    HorizontalBox,
    LayoutBox,
    Slider,
    Text,
    MultilineTextBox,
    VerticalBox,
} = require("../../../../wrapper/api");

class MiltyDraftSettingsUI extends VerticalBox {
    constructor(sliceGenerator, factionGenerator, callbacks) {
        assert(sliceGenerator instanceof MiltySliceGenerator);
        assert(factionGenerator instanceof MiltyFactionGenerator);
        assert(typeof callbacks.onFinish === "function");
        assert(typeof callbacks.onCancel === "function");

        super();

        this._sliceGenerator = sliceGenerator;
        this._factionGenerator = factionGenerator;
        this._callbacks = callbacks;

        this.setChildDistance(CONFIG.spacing);

        this._createDraftSettingsUI();
    }

    _createDraftSettingsUI() {
        assert(this._sliceGenerator);
        assert(this._factionGenerator);

        this.removeAllChildren();

        const customInputLabel = new Text()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.draft.custom_input"));
        this.addChild(customInputLabel);
        const customInput = new MultilineTextBox()
            .setFontSize(CONFIG.fontSize)
            .setMaxLength(1000);
        const customInputBox = new LayoutBox()
            .setChild(customInput)
            .setMinimumHeight(CONFIG.fontSize * 3);
        this.addChild(customInputBox);

        const extraLegendariesAndWormholes = new CheckBox()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.draft.extra_legendaries_and_wormholes"))
            .setIsChecked(true);
        this.addChild(extraLegendariesAndWormholes);
        extraLegendariesAndWormholes.onCheckStateChanged.add(
            (checkbox, player, isChecked) => {
                this._sliceGenerator.setExtraLegendariesAndWormholes(isChecked);
            }
        );

        const sliceCountLabel = new Text()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.draft.slice_count"));
        const sliceCountSlider = new Slider()
            .setFontSize(CONFIG.fontSize)
            .setTextBoxWidth(CONFIG.fontSize * 4)
            .setMinValue(MiltySliceGenerator.minCount)
            .setMaxValue(MiltySliceGenerator.maxCount)
            .setStepSize(1)
            .setValue(this._sliceGenerator.getCount());
        sliceCountSlider.onValueChanged.add((slider, player, value) => {
            this._sliceGenerator.setCount(value);
        });
        const sliceCountPanel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(sliceCountLabel, 2)
            .addChild(sliceCountSlider, 4);
        this.addChild(sliceCountPanel);

        const factionCountLabel = new Text()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.draft.faction_count"));
        const factionCountSlider = new Slider()
            .setFontSize(CONFIG.fontSize)
            .setTextBoxWidth(CONFIG.fontSize * 4)
            .setMinValue(MiltyFactionGenerator.minCount)
            .setMaxValue(MiltyFactionGenerator.maxCount)
            .setStepSize(1)
            .setValue(this._factionGenerator.getCount());
        factionCountSlider.onValueChanged.add((slider, player, value) => {
            this._factionGenerator.setCount(value);
        });
        const factionCountPanel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(factionCountLabel, 2)
            .addChild(factionCountSlider, 4);
        this.addChild(factionCountPanel);

        const onFinishedButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.ready"));
        onFinishedButton.onClicked.add((button, player) => {
            const customInputValue = customInput.getText();
            const success = this._callbacks.onFinish(customInputValue, player);
            if (success) {
                this._createDraftInProgressUI();
            }
        });

        this.addChild(new LayoutBox(), 1);

        this.addChild(onFinishedButton);
    }

    _createDraftInProgressUI() {
        this.removeAllChildren();

        const onCancelButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.cancel"));
        onCancelButton.onClicked.add((button, player) => {
            this._callbacks.onCancel(player);
            this._createDraftSettingsUI();
        });

        const draftInProgress = new Text()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.draft.in_progress"));
        this.addChild(draftInProgress);

        this.addChild(new LayoutBox(), 1);

        this.addChild(onCancelButton);
    }
}

module.exports = { MiltyDraftSettingsUI };
