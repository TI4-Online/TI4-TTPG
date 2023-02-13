const assert = require("../../../../wrapper/assert-wrapper");
const locale = require("../../../../lib/locale");
const {
    MiltyFactionGenerator,
} = require("../../../../lib/draft/milty/milty-faction-generator");
const {
    BunkerSliceGenerator,
} = require("../../../../lib/draft/bunker/bunker-slice-generator");
const {
    ThrottleClickHandler,
} = require("../../../../lib/ui/throttle-click-handler");
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
    world,
} = require("../../../../wrapper/api");

class BunkerDraftSettingsUI extends VerticalBox {
    constructor(sliceGenerator, factionGenerator, callbacks) {
        assert(sliceGenerator instanceof BunkerSliceGenerator);
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

        if (world.TI4.config.playerCount > 6) {
            const tooMany = new Text()
                .setFontSize(CONFIG.fontSize)
                .setText(locale("ui.draft.bunker_too_many_players"));
            this.addChild(tooMany);
            return;
        }

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

        const sliceCountLabel = new Text()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.draft.bunker_count"));
        const sliceCountSlider = new Slider()
            .setFontSize(CONFIG.fontSize)
            .setTextBoxWidth(CONFIG.fontSize * 4)
            .setMinValue(BunkerSliceGenerator.minCount)
            .setMaxValue(BunkerSliceGenerator.maxCount)
            .setStepSize(1)
            .setValue(this._sliceGenerator.getBunkerCount());
        sliceCountSlider.onValueChanged.add((slider, player, value) => {
            this._sliceGenerator.setBunkerCount(value);
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

        const factionsFromCards = new CheckBox()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.draft.factions_from_cards"))
            .setIsChecked(this._factionGenerator.getFactionsFromCards());
        this.addChild(factionsFromCards);
        factionsFromCards.onCheckStateChanged.add(
            (checkbox, player, isChecked) => {
                this._factionGenerator.setFactionsFromCards(isChecked);
            }
        );

        const onFinishedButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.ready"));
        onFinishedButton.onClicked.add(
            ThrottleClickHandler.wrap((button, player) => {
                const customInputValue = customInput.getText();
                const success = this._callbacks.onFinish(
                    customInputValue,
                    player
                );
                if (success) {
                    this._createDraftInProgressUI();
                }
            })
        );

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
            this._sliceGenerator.reset();
        });

        const draftInProgress = new Text()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.draft.in_progress"));
        this.addChild(draftInProgress);

        this.addChild(new LayoutBox(), 1);

        this.addChild(onCancelButton);
    }
}

module.exports = { BunkerDraftSettingsUI };
