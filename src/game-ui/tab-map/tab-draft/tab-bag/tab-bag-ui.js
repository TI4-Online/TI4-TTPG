const assert = require("../../../../wrapper/assert-wrapper");
const locale = require("../../../../lib/locale");
const CONFIG = require("../../../game-ui-config");
const { BagDraft } = require("../../../../lib/draft/bag/bag-draft");
const {
    Button,
    HorizontalBox,
    LayoutBox,
    Slider,
    Text,
    VerticalBox,
    world,
} = require("../../../../wrapper/api");

const SLIDER = {
    RED: { MIN: 1, DEFAULT: 2 },
    BLUE: { MIN: 1, DEFAULT: 3 },
    FACTION: { MIN: 1, DEFAULT: 2 },
};

class TabBagDraftUI extends VerticalBox {
    constructor(onClickHandlers) {
        assert(typeof onClickHandlers.onFinish === "function");
        assert(typeof onClickHandlers.onCancel === "function");

        super();
        this._callbacks = onClickHandlers;

        this.setChildDistance(CONFIG.spacing);
        this._createDraftSettingsUI();
    }

    _createDraftSettingsUI() {
        this.removeAllChildren();

        const playerCount = world.TI4.config.playerCount;

        const availRed = BagDraft.draftSystems(-1, true).length;
        const availBlue = BagDraft.draftSystems(-1, false).length;
        const availFactions = world.TI4.getAllFactions().length - 3; // at most one keleres, minus one for linked faction

        const maxRed = Math.floor(availRed / playerCount);
        const maxBlue = Math.floor(availBlue / playerCount);
        const maxFactions = Math.floor(availFactions / playerCount);

        // RED
        const redCountLabel = new Text()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.draft.red_count"));
        const redCountSlider = new Slider()
            .setFontSize(CONFIG.fontSize)
            .setTextBoxWidth(CONFIG.fontSize * 4)
            .setMinValue(SLIDER.RED.MIN)
            .setMaxValue(maxRed)
            .setStepSize(1)
            .setValue(SLIDER.RED.DEFAULT);
        const redCountPanel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(redCountLabel, 2)
            .addChild(redCountSlider, 4);
        this.addChild(redCountPanel);

        // BLUE
        const blueCountLabel = new Text()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.draft.blue_count"));
        const blueCountSlider = new Slider()
            .setFontSize(CONFIG.fontSize)
            .setTextBoxWidth(CONFIG.fontSize * 4)
            .setMinValue(SLIDER.BLUE.MIN)
            .setMaxValue(maxBlue)
            .setStepSize(1)
            .setValue(SLIDER.BLUE.DEFAULT);
        const blueCountPanel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(blueCountLabel, 2)
            .addChild(blueCountSlider, 4);
        this.addChild(blueCountPanel);

        // FACTION
        const factionCountLabel = new Text()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.draft.faction_count"));
        const factionCountSlider = new Slider()
            .setFontSize(CONFIG.fontSize)
            .setTextBoxWidth(CONFIG.fontSize * 4)
            .setMinValue(SLIDER.FACTION.MIN)
            .setMaxValue(maxFactions)
            .setStepSize(1)
            .setValue(SLIDER.FACTION.DEFAULT);
        const factionCountPanel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(factionCountLabel, 2)
            .addChild(factionCountSlider, 4);
        this.addChild(factionCountPanel);

        // FILLER
        this.addChild(new LayoutBox(), 1);

        // DONE
        const onFinishedButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.ready"));
        onFinishedButton.onClicked.add((button, player) => {
            const customInputValue = {
                red: redCountSlider.getValue(),
                blue: blueCountSlider.getValue(),
                faction: factionCountSlider.getValue(),
            };
            const success = this._callbacks.onFinish(customInputValue, player);
            assert(typeof success === "boolean");
            if (success) {
                this._createDraftInProgressUI();
            }
        });
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

module.exports = { TabBagDraftUI };
