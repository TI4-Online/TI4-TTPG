const assert = require("../../../wrapper/assert-wrapper");
const locale = require("../../locale");
const { MiltyFactionGenerator } = require("./milty-faction-generator");
const { MiltySliceGenerator } = require("./milty-slice-generator");
const {
    Button,
    CheckBox,
    LayoutBox,
    Slider,
    Text,
    MultilineTextBox,
    VerticalBox,
} = require("../../../wrapper/api");

class MiltyDraftSettingsUI extends VerticalBox {
    constructor(sliceGenerator, factionGenerator, callbacks) {
        assert(sliceGenerator instanceof MiltySliceGenerator);
        assert(factionGenerator instanceof MiltyFactionGenerator);
        assert(typeof callbacks.onFinish === "function");
        assert(typeof callbacks.onCancel === "function");

        super();

        this.setChildDistance(5);

        const customInputLabel = new Text().setText(
            locale("ui.draft.custom_input")
        );
        this.addChild(customInputLabel);
        const customInput = new MultilineTextBox().setMaxLength(1000);
        const customInputBox = new LayoutBox()
            .setChild(customInput)
            .setMinimumHeight(50);
        this.addChild(customInputBox);

        const sliceCountLabel = new Text().setText(
            locale("ui.draft.slice_count")
        );
        this.addChild(sliceCountLabel);
        const sliceCountSlider = new Slider()
            .setMinValue(MiltySliceGenerator.minCount)
            .setMaxValue(MiltySliceGenerator.maxCount)
            .setStepSize(1)
            .setValue(sliceGenerator.getCount());
        this.addChild(sliceCountSlider);
        sliceCountSlider.onValueChanged.add((slider, player, value) => {
            sliceGenerator.setCount(value);
        });

        const extraLegendariesAndWormholes = new CheckBox().setText(
            locale("ui.draft.extra_legendaries_and_wormholes")
        );
        this.addChild(extraLegendariesAndWormholes);
        extraLegendariesAndWormholes.onCheckStateChanged.add(
            (checkbox, player, isChecked) => {
                sliceGenerator.setExtraLegendariesAndWormholes(isChecked);
            }
        );

        const factionCountLabel = new Text().setText(
            locale("ui.draft.faction_count")
        );
        this.addChild(factionCountLabel);
        const factionCountSlider = new Slider()
            .setMinValue(MiltyFactionGenerator.minCount)
            .setMaxValue(MiltyFactionGenerator.maxCount)
            .setStepSize(1)
            .setValue(factionGenerator.getCount());
        this.addChild(factionCountSlider);
        factionCountSlider.onValueChanged.add((slider, player, value) => {
            factionGenerator.setCount(value);
        });

        const applyEnabled = (value) => {
            sliceCountLabel.setEnabled(value);
            sliceCountSlider.setEnabled(value);
            extraLegendariesAndWormholes.setEnabled(value);
            factionCountLabel.setEnabled(value);
            factionCountSlider.setEnabled(value);
            onFinishedButton.setEnabled(value);
        };

        const onFinishedButton = new Button().setText(
            locale("ui.button.ready")
        );
        this.addChild(onFinishedButton);
        onFinishedButton.onClicked.add((button, player) => {
            const customInputValue = customInput.getText();
            const success = callbacks.onFinish(customInputValue);
            applyEnabled(!success);
        });

        const onCancelButton = new Button().setText(locale("ui.button.cancel"));
        this.addChild(onCancelButton);
        onCancelButton.onClicked.add((button, player) => {
            applyEnabled(true);
            callbacks.onCancel();
        });
    }
}

module.exports = { MiltyDraftSettingsUI };
