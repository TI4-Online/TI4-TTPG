const assert = require("../../../../wrapper/assert-wrapper");
const locale = require("../../../../lib/locale");
const CONFIG = require("../../../game-ui-config");
const { BagDraft } = require("../../../../lib/draft/bag/bag-draft");
const { WidgetFactory } = require("../../../../lib/ui/widget-factory");
const { world } = require("../../../../wrapper/api");

const SLIDER = {
    RED: { MIN: 1, DEFAULT: 2 },
    BLUE: { MIN: 1, DEFAULT: 3 },
    FACTION: { MIN: 1, DEFAULT: 2 },
};

class TabBagDraftUI {
    constructor(onClickHandlers) {
        assert(typeof onClickHandlers.onFinish === "function");
        assert(typeof onClickHandlers.onCancel === "function");

        this._box = WidgetFactory.layoutBox();
        this._callbacks = onClickHandlers;

        this._createDraftSettingsUI();
    }

    getWidget() {
        return this._box;
    }

    _createDraftSettingsUI() {
        const playerCount = world.TI4.config.playerCount;

        const availRed = BagDraft.draftSystems(-1, true).length;
        const availBlue = BagDraft.draftSystems(-1, false).length;
        const availFactions = world.TI4.getAllFactions().length - 3; // at most one keleres, minus one for linked faction

        const maxRed = Math.floor(availRed / playerCount);
        const maxBlue = Math.floor(availBlue / playerCount);
        const maxFactions = Math.floor(availFactions / playerCount);

        const old = this._box.getChild();
        if (old) {
            this._box.setChild(undefined);
            WidgetFactory.release(old);
        }
        const verticalBox = WidgetFactory.verticalBox().setChildDistance(
            CONFIG.spacing
        );
        this._box.setChild(verticalBox);

        // RED
        const redCountLabel = WidgetFactory.text()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.draft.red_count"));
        const redCountSlider = WidgetFactory.slider()
            .setFontSize(CONFIG.fontSize)
            .setTextBoxWidth(CONFIG.fontSize * 4)
            .setMinValue(SLIDER.RED.MIN)
            .setMaxValue(maxRed)
            .setStepSize(1)
            .setValue(SLIDER.RED.DEFAULT);
        const redCountPanel = WidgetFactory.horizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(redCountLabel, 2)
            .addChild(redCountSlider, 4);
        verticalBox.addChild(redCountPanel);

        // BLUE
        const blueCountLabel = WidgetFactory.text()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.draft.blue_count"));
        const blueCountSlider = WidgetFactory.slider()
            .setFontSize(CONFIG.fontSize)
            .setTextBoxWidth(CONFIG.fontSize * 4)
            .setMinValue(SLIDER.BLUE.MIN)
            .setMaxValue(maxBlue)
            .setStepSize(1)
            .setValue(SLIDER.BLUE.DEFAULT);
        const blueCountPanel = WidgetFactory.horizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(blueCountLabel, 2)
            .addChild(blueCountSlider, 4);
        verticalBox.addChild(blueCountPanel);

        // FACTION
        const factionCountLabel = WidgetFactory.text()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.draft.faction_count"));
        const factionCountSlider = WidgetFactory.slider()
            .setFontSize(CONFIG.fontSize)
            .setTextBoxWidth(CONFIG.fontSize * 4)
            .setMinValue(SLIDER.FACTION.MIN)
            .setMaxValue(maxFactions)
            .setStepSize(1)
            .setValue(SLIDER.FACTION.DEFAULT);
        const factionCountPanel = WidgetFactory.horizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(factionCountLabel, 2)
            .addChild(factionCountSlider, 4);
        verticalBox.addChild(factionCountPanel);

        // FILLER
        verticalBox.addChild(WidgetFactory.layoutBox(), 1);

        // DONE
        const onFinishedButton = WidgetFactory.button()
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
        verticalBox.addChild(onFinishedButton);
    }

    _createDraftInProgressUI() {
        const old = this._box.getChild();
        if (old) {
            this._box.setChild(undefined);
            WidgetFactory.release(old);
        }
        const verticalBox = WidgetFactory.verticalBox().setChildDistance(
            CONFIG.spacing
        );
        this._box.setChild(verticalBox);

        const onCancelButton = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.cancel"));
        onCancelButton.onClicked.add((button, player) => {
            this._callbacks.onCancel(player);
            this._createDraftSettingsUI();
        });

        const draftInProgress = WidgetFactory.text()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.draft.in_progress"));
        verticalBox.addChild(draftInProgress);

        verticalBox.addChild(WidgetFactory.layoutBox(), 1);

        verticalBox.addChild(onCancelButton);
    }
}

module.exports = { TabBagDraftUI };
