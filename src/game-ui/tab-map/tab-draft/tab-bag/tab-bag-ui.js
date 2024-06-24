const assert = require("../../../../wrapper/assert-wrapper");
const locale = require("../../../../lib/locale");
const CONFIG = require("../../../game-ui-config");
const { WidgetFactory } = require("../../../../lib/ui/widget-factory");
const { world } = require("../../../../wrapper/api");
const { BagDraft } = require("../../../../lib/draft/bag/bag-draft");

class TabBagDraftUI {
    constructor(onClickHandlers, bagDraft) {
        assert(typeof onClickHandlers.onFinish === "function");
        assert(typeof onClickHandlers.onCancel === "function");

        this._box = WidgetFactory.layoutBox();
        this._callbacks = onClickHandlers;
        this._bagDraft = bagDraft;

        this._createDraftSettingsUI();
    }

    getWidget() {
        return this._box;
    }

    _createDraftSettingsUI() {
        const config = this._bagDraft.getConfig();
        assert(config);
        assert(typeof config.high.avail === "number");
        assert(typeof config.med.avail === "number");
        assert(typeof config.low.avail === "number");
        assert(typeof config.minAlpha.max === "number");
        assert(typeof config.minBeta.max === "number");
        assert(typeof config.minLegendary.max === "number");

        const fontSize = CONFIG.fontSize * 0.75;
        const playerCount = world.TI4.config.playerCount;

        const availFactions = world.TI4.getAllFactions().length - 3; // at most one keleres, minus one for linked faction

        const maxRed = Math.floor(config.red.avail / playerCount);
        const maxBlueHigh = Math.floor(config.high.avail / playerCount);
        const maxBlueMed = Math.floor(config.med.avail / playerCount);
        const maxBlueLow = Math.floor(config.low.avail / playerCount);
        const maxFactions = Math.floor(availFactions / playerCount);

        const old = this._box.getChild();
        if (old) {
            this._box.setChild(undefined);
            WidgetFactory.release(old);
        }
        const leftBox = WidgetFactory.verticalBox().setChildDistance(
            CONFIG.spacing
        );
        const rightBox = WidgetFactory.verticalBox().setChildDistance(
            CONFIG.spacing
        );
        const leftRightPanel = WidgetFactory.horizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(leftBox, 1)
            .addChild(WidgetFactory.border().setColor(CONFIG.spacerColor), 0)
            .addChild(rightBox, 1);
        const verticalBox = WidgetFactory.verticalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(leftRightPanel);
        this._box.setChild(verticalBox);

        const weightLabel = 4;
        const wightSlider = 3;

        // RED
        const redCountLabel = WidgetFactory.text()
            .setAutoWrap(true)
            .setFontSize(fontSize)
            .setText(locale("ui.draft.red_count"));
        const redCountSlider = WidgetFactory.slider()
            .setFontSize(fontSize)
            .setTextBoxWidth(fontSize * 4)
            .setMinValue(config.red.min)
            .setMaxValue(maxRed)
            .setStepSize(1)
            .setValue(config.red.default);
        redCountSlider.onValueChanged.add((slider, player, value) => {
            config.red._value = value;
        });
        const redCountPanel = WidgetFactory.horizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(redCountLabel, weightLabel)
            .addChild(redCountSlider, wightSlider);
        leftBox.addChild(redCountPanel);

        // BLUE
        const highCountLabel = WidgetFactory.text()
            .setAutoWrap(true)
            .setFontSize(fontSize)
            .setText(locale("ui.draft.blue_high_count"));
        const highCountSlider = WidgetFactory.slider()
            .setFontSize(fontSize)
            .setTextBoxWidth(fontSize * 4)
            .setMinValue(config.high.min)
            .setMaxValue(maxBlueHigh)
            .setStepSize(1)
            .setValue(config.high.default);
        highCountSlider.onValueChanged.add((slider, player, value) => {
            config.high._value = value;
        });
        const highCountPanel = WidgetFactory.horizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(highCountLabel, weightLabel)
            .addChild(highCountSlider, wightSlider);
        leftBox.addChild(highCountPanel);

        const medCountLabel = WidgetFactory.text()
            .setAutoWrap(true)
            .setFontSize(fontSize)
            .setText(locale("ui.draft.blue_med_count"));
        const medCountSlider = WidgetFactory.slider()
            .setFontSize(fontSize)
            .setTextBoxWidth(fontSize * 4)
            .setMinValue(config.med.min)
            .setMaxValue(maxBlueMed)
            .setStepSize(1)
            .setValue(config.med.default);
        medCountSlider.onValueChanged.add((slider, player, value) => {
            config.med._value = value;
        });
        const medCountPanel = WidgetFactory.horizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(medCountLabel, weightLabel)
            .addChild(medCountSlider, wightSlider);
        leftBox.addChild(medCountPanel);

        const lowCountLabel = WidgetFactory.text()
            .setAutoWrap(true)
            .setFontSize(fontSize)
            .setText(locale("ui.draft.blue_low_count"));
        const lowCountSlider = WidgetFactory.slider()
            .setFontSize(fontSize)
            .setTextBoxWidth(fontSize * 4)
            .setMinValue(config.low.min)
            .setMaxValue(maxBlueLow)
            .setStepSize(1)
            .setValue(config.low.default);
        lowCountSlider.onValueChanged.add((slider, player, value) => {
            config.low._value = value;
        });
        const lowCountPanel = WidgetFactory.horizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(lowCountLabel, weightLabel)
            .addChild(lowCountSlider, wightSlider);
        leftBox.addChild(lowCountPanel);

        // FACTION
        const factionCountLabel = WidgetFactory.text()
            .setAutoWrap(true)
            .setFontSize(fontSize)
            .setText(locale("ui.draft.faction_count"));
        const factionCountSlider = WidgetFactory.slider()
            .setFontSize(fontSize)
            .setTextBoxWidth(fontSize * 4)
            .setMinValue(config.faction.min)
            .setMaxValue(maxFactions)
            .setStepSize(1)
            .setValue(config.faction.default);
        factionCountSlider.onValueChanged.add((slider, player, value) => {
            config.faction._value = value;
        });
        const factionCountPanel = WidgetFactory.horizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(factionCountLabel, weightLabel)
            .addChild(factionCountSlider, wightSlider);
        leftBox.addChild(factionCountPanel);

        // ALPHA
        const alphaCountLabel = WidgetFactory.text()
            .setAutoWrap(true)
            .setFontSize(fontSize)
            .setText(locale("ui.draft.alpha_min"));
        const alphaCountSlider = WidgetFactory.slider()
            .setFontSize(fontSize)
            .setTextBoxWidth(fontSize * 4)
            .setMinValue(config.minAlpha.min)
            .setMaxValue(config.minAlpha.max)
            .setStepSize(1)
            .setValue(config.minAlpha.default);
        alphaCountSlider.onValueChanged.add((slider, player, value) => {
            config.minAlpha._value = value;
        });
        const alphaCountPanel = WidgetFactory.horizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(alphaCountLabel, weightLabel)
            .addChild(alphaCountSlider, wightSlider);
        rightBox.addChild(alphaCountPanel);

        // BETA
        const betaCountLabel = WidgetFactory.text()
            .setAutoWrap(true)
            .setFontSize(fontSize)
            .setText(locale("ui.draft.beta_min"));
        const betaCountSlider = WidgetFactory.slider()
            .setFontSize(fontSize)
            .setTextBoxWidth(fontSize * 4)
            .setMinValue(config.minBeta.min)
            .setMaxValue(config.minBeta.max)
            .setStepSize(1)
            .setValue(config.minBeta.default);
        betaCountSlider.onValueChanged.add((slider, player, value) => {
            config.minBeta._value = value;
        });
        const betaCountPanel = WidgetFactory.horizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(betaCountLabel, weightLabel)
            .addChild(betaCountSlider, wightSlider);
        rightBox.addChild(betaCountPanel);

        // LEGENDARY
        const legendaryCountLabel = WidgetFactory.text()
            .setAutoWrap(true)
            .setFontSize(fontSize)
            .setText(locale("ui.draft.legendary_min"));
        const legendaryCountSlider = WidgetFactory.slider()
            .setFontSize(fontSize)
            .setTextBoxWidth(fontSize * 4)
            .setMinValue(config.minLegendary.min)
            .setMaxValue(config.minLegendary.max)
            .setStepSize(1)
            .setValue(config.minLegendary.default);
        legendaryCountSlider.onValueChanged.add((slider, player, value) => {
            config.minLegendary._value = value;
        });
        const legendaryCountPanel = WidgetFactory.horizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(legendaryCountLabel, weightLabel)
            .addChild(legendaryCountSlider, wightSlider);
        rightBox.addChild(legendaryCountPanel);

        // USE FACTIONS ON TABLE
        const useFactionsOnTable = WidgetFactory.checkBox()
            .setFontSize(fontSize)
            .setText(locale("ui.draft.factions_from_cards"));
        useFactionsOnTable.onCheckStateChanged.add(
            (checkBox, player, isChecked) => {
                config.useFactionsOnTable = isChecked;
            }
        );
        verticalBox.addChild(useFactionsOnTable);

        // FILLER
        verticalBox.addChild(WidgetFactory.layoutBox(), 1);

        // DONE
        const onFinishedButton = WidgetFactory.button()
            .setFontSize(fontSize)
            .setText(locale("ui.button.ready"));
        onFinishedButton.onClicked.add((button, player) => {
            const success = this._callbacks.onFinish(config, player);
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

        const showPrivacyZonesButton = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("Add privacy zones"));
        showPrivacyZonesButton.onClicked.add((button, player) => {
            BagDraft.createPrivacyZones();
        });
        const hidePrivacyZonesButton = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("Remove privacy zones"));
        hidePrivacyZonesButton.onClicked.add((button, player) => {
            BagDraft.destroyPrivacyZones();
        });

        const onCancelButton = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.cancel"));
        onCancelButton.onClicked.add((button, player) => {
            BagDraft.destroyPrivacyZones();
            this._callbacks.onCancel(player);
            this._createDraftSettingsUI();
        });

        const draftInProgress = WidgetFactory.text()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.draft.in_progress"));
        verticalBox
            .addChild(draftInProgress)
            .addChild(showPrivacyZonesButton)
            .addChild(hidePrivacyZonesButton);

        verticalBox.addChild(WidgetFactory.layoutBox(), 1);

        verticalBox.addChild(onCancelButton);
    }
}

module.exports = { TabBagDraftUI };
