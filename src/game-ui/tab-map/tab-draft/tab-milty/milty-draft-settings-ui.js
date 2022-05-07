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

        this.setChildDistance(CONFIG.spacing);

        const customInputLabel = new Text()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.draft.custom_input"));
        this.addChild(customInputLabel);
        const customInput = new MultilineTextBox().setMaxLength(1000);
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
                sliceGenerator.setExtraLegendariesAndWormholes(isChecked);
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
            .setValue(sliceGenerator.getCount());
        sliceCountSlider.onValueChanged.add((slider, player, value) => {
            sliceGenerator.setCount(value);
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
            .setValue(factionGenerator.getCount());
        factionCountSlider.onValueChanged.add((slider, player, value) => {
            factionGenerator.setCount(value);
        });
        const factionCountPanel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(factionCountLabel, 2)
            .addChild(factionCountSlider, 4);
        this.addChild(factionCountPanel);

        const applyEnabled = (value) => {
            sliceCountLabel.setEnabled(value);
            sliceCountSlider.setEnabled(value);
            extraLegendariesAndWormholes.setEnabled(value);
            factionCountLabel.setEnabled(value);
            factionCountSlider.setEnabled(value);
            onFinishedButton.setEnabled(value);
        };

        const onFinishedButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.ready"));
        onFinishedButton.onClicked.add((button, player) => {
            const customInputValue = customInput.getText();
            const success = callbacks.onFinish(customInputValue, player);
            applyEnabled(!success);
        });

        this.addChild(new LayoutBox(), 1);

        const onCancelButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.cancel"));
        onCancelButton.onClicked.add((button, player) => {
            applyEnabled(true);
            callbacks.onCancel(player);
        });
        const readyCancelPanel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(onFinishedButton, 1)
            .addChild(onCancelButton, 1);
        this.addChild(readyCancelPanel);
    }
}

module.exports = { MiltyDraftSettingsUI };
