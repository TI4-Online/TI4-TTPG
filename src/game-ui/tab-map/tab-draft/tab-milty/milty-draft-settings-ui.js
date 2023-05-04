const assert = require("../../../../wrapper/assert-wrapper");
const locale = require("../../../../lib/locale");
const { ColorUtil } = require("../../../../lib/color/color-util");
const {
    MiltyFactionGenerator,
} = require("../../../../lib/draft/milty/milty-faction-generator");
const {
    MiltySliceGenerator,
} = require("../../../../lib/draft/milty/milty-slice-generator");
const { WidgetFactory } = require("../../../../lib/ui/widget-factory");
const CONFIG = require("../../../game-ui-config");
const { Color, refPackageId, world } = require("../../../../wrapper/api");

class MiltyDraftSettingsUI {
    constructor(sliceGenerator, factionGenerator, callbacks) {
        assert(sliceGenerator instanceof MiltySliceGenerator);
        assert(factionGenerator instanceof MiltyFactionGenerator);
        assert(typeof callbacks.onFinish === "function");
        assert(typeof callbacks.onCancel === "function");

        this._mainBox = WidgetFactory.layoutBox();

        this._sliceGenerator = sliceGenerator;
        this._factionGenerator = factionGenerator;
        this._callbacks = callbacks;

        this._createDraftSettingsUI({
            customInputString: "",
            factions: [],
        });
    }

    getWidget() {
        return this._mainBox;
    }

    _createDraftSettingsUI(persistentMemory) {
        assert(typeof persistentMemory.customInputString === "string");
        assert(Array.isArray(persistentMemory.factions));

        assert(this._sliceGenerator);
        assert(this._factionGenerator);

        const old = this._mainBox.getChild();
        if (old) {
            this._mainBox.setChild(undefined);
            WidgetFactory.release(old);
        }
        const panel = WidgetFactory.verticalBox().setChildDistance(
            CONFIG.spacing
        );
        this._mainBox.setChild(panel);

        const customInputLabel = WidgetFactory.text()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.draft.custom_input"));
        const customInput = WidgetFactory.multilineTextBox()
            .setFontSize(CONFIG.fontSize)
            .setMaxLength(1000)
            .setText(persistentMemory.customInputString);
        const customInputBox = WidgetFactory.layoutBox()
            .setChild(customInput)
            .setOverrideHeight(CONFIG.fontSize * 4.5);
        const customLeft = WidgetFactory.verticalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(customInputLabel)
            .addChild(customInputBox);

        const customButtonLabel = WidgetFactory.text()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.draft.faction_input"));
        const onCustomButton = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.custom"));
        onCustomButton.onClicked.add((button, player) => {
            this._callbacks.onCustom(player);
            persistentMemory.customInputString = customInput.getText();
            this._createCustomSelectionUI(persistentMemory);
        });
        const customRight = WidgetFactory.verticalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(customButtonLabel)
            .addChild(onCustomButton);

        const customHBox = WidgetFactory.horizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(customLeft, 9)
            .addChild(WidgetFactory.border().setColor(CONFIG.spacerColor))
            .addChild(customRight, 3);
        panel.addChild(customHBox);

        const extraLegendariesAndWormholes = WidgetFactory.checkBox()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.draft.extra_legendaries_and_wormholes"))
            .setIsChecked(true);
        panel.addChild(extraLegendariesAndWormholes);
        extraLegendariesAndWormholes.onCheckStateChanged.add(
            (checkbox, player, isChecked) => {
                this._sliceGenerator.setExtraLegendariesAndWormholes(isChecked);
            }
        );

        const sliceCountLabel = WidgetFactory.text()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.draft.slice_count"));
        const sliceCountSlider = WidgetFactory.slider()
            .setFontSize(CONFIG.fontSize)
            .setTextBoxWidth(CONFIG.fontSize * 4)
            .setMinValue(MiltySliceGenerator.minCount)
            .setMaxValue(MiltySliceGenerator.maxCount)
            .setStepSize(1)
            .setValue(this._sliceGenerator.getCount());
        sliceCountSlider.onValueChanged.add((slider, player, value) => {
            this._sliceGenerator.setCount(value);
        });
        const sliceCountPanel = WidgetFactory.horizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(sliceCountLabel, 2)
            .addChild(sliceCountSlider, 4);
        panel.addChild(sliceCountPanel);

        const factionCountLabel = WidgetFactory.text()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.draft.faction_count"));
        const factionCountSlider = WidgetFactory.slider()
            .setFontSize(CONFIG.fontSize)
            .setTextBoxWidth(CONFIG.fontSize * 4)
            .setMinValue(MiltyFactionGenerator.minCount)
            .setMaxValue(MiltyFactionGenerator.maxCount)
            .setStepSize(1)
            .setValue(this._factionGenerator.getCount());
        factionCountSlider.onValueChanged.add((slider, player, value) => {
            this._factionGenerator.setCount(value);
        });
        const factionCountPanel = WidgetFactory.horizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(factionCountLabel, 2)
            .addChild(factionCountSlider, 4);
        panel.addChild(factionCountPanel);

        const factionsFromCards = WidgetFactory.checkBox()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.draft.factions_from_cards"))
            .setIsChecked(this._factionGenerator.getFactionsFromCards());
        panel.addChild(factionsFromCards);
        factionsFromCards.onCheckStateChanged.add(
            (checkbox, player, isChecked) => {
                this._factionGenerator.setFactionsFromCards(isChecked);
            }
        );

        const onFinishedButton = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.ready"));
        onFinishedButton.onClicked.add((button, player) => {
            const customInputValue = customInput
                .getText()
                .replaceAll("\\n", " ");
            const success = this._callbacks.onFinish(customInputValue, player);
            if (success) {
                this._createDraftInProgressUI(persistentMemory);
            }
        });

        panel.addChild(WidgetFactory.layoutBox(), 1);

        panel.addChild(onFinishedButton);
    }

    _createCustomSelectionUI(persistentMemory) {
        assert(typeof persistentMemory.customInputString === "string");
        assert(Array.isArray(persistentMemory.factions));

        const old = this._mainBox.getChild();
        if (old) {
            this._mainBox.setChild(undefined);
            WidgetFactory.release(old);
        }
        const panel = WidgetFactory.verticalBox().setChildDistance(
            CONFIG.spacing
        );
        this._mainBox.setChild(panel);

        const sliceInputLabel = WidgetFactory.text()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.draft.slice_input"));
        panel.addChild(sliceInputLabel);
        const sliceInput = WidgetFactory.multilineTextBox()
            .setFontSize(CONFIG.fontSize)
            .setMaxLength(1000)
            .setText(persistentMemory.customInputString);
        const customInputBox = WidgetFactory.layoutBox()
            .setChild(sliceInput)
            .setMinimumHeight(CONFIG.fontSize * 2);
        panel.addChild(customInputBox);

        const factionInputLabel = WidgetFactory.text()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.draft.faction_input"));
        panel.addChild(factionInputLabel);

        const factionGridH1 = WidgetFactory.horizontalBox().setChildDistance(
            CONFIG.spacing * 0.75
        );
        const factionGridH2 = WidgetFactory.horizontalBox().setChildDistance(
            CONFIG.spacing * 0.75
        );
        const factionGridH3 = WidgetFactory.horizontalBox().setChildDistance(
            CONFIG.spacing * 0.75
        );
        const factionGridV = WidgetFactory.verticalBox()
            .setHorizontalAlignment(2)
            .setChildDistance(CONFIG.spacing * 0.2)
            .addChild(factionGridH1)
            .addChild(factionGridH2)
            .addChild(factionGridH3);

        let itr = 0;
        let colLen = 6;
        if (world.TI4.config.pok && world.TI4.config.codex3) {
            colLen = 9;
        } else if (world.TI4.config.pok) {
            colLen = 8;
        } else if (world.TI4.config.codex3) {
            colLen = 7;
        }

        world.TI4.getAllFactions().forEach((faction) => {
            const keleresVariants = [
                "keleres_argent",
                "keleres_xxcha",
                "keleres_mentak",
            ];
            const variantColor = [
                ColorUtil.colorFromHex("#ce3f17"),
                ColorUtil.colorFromHex("#279D73"),
                ColorUtil.colorFromHex("#482706"),
            ];
            let color = new Color(0, 0, 0);
            if (persistentMemory.factions.includes(faction.nsidName)) {
                color = new Color(1, 1, 1);
            }
            let image = faction.icon;
            if (keleresVariants.includes(faction.nsidName)) {
                image =
                    faction.icon.split("keleres")[0] +
                    faction.nsidName +
                    "_icon.png";
            }
            const factionButton = WidgetFactory.imageButton()
                .setImageSize(0, 100)
                .setImage(image, refPackageId);
            factionButton.onClicked.add((button, player) => {
                const newMemory = this._callbacks.onFaction(
                    faction.nsidName,
                    sliceInput.getText(),
                    player
                );
                this._createCustomSelectionUI(newMemory);
            });
            const factionBorder = WidgetFactory.border().setColor(color);
            if (keleresVariants.includes(faction.nsidName)) {
                const keleresBorder = WidgetFactory.border()
                    .setChild(factionButton)
                    .setColor(
                        variantColor[keleresVariants.indexOf(faction.nsidName)]
                    );
                factionBorder.setChild(keleresBorder);
            } else {
                const exBorder = WidgetFactory.border()
                    .setChild(factionButton)
                    .setColor(color);
                factionBorder.setChild(exBorder);
            }

            const facName = WidgetFactory.text()
                .setFontSize(CONFIG.fontSize * 0.35)
                .setJustification(2)
                .setText(faction.nameAbbr);
            const facVBox = WidgetFactory.verticalBox()
                .setHorizontalAlignment(2)
                .setChildDistance(CONFIG.spacing * 0)
                .addChild(factionBorder)
                .addChild(facName);
            const facBox = WidgetFactory.layoutBox()
                .setOverrideWidth(150)
                .setChild(facVBox);

            let row = itr / colLen;
            itr = itr + 1;
            factionGridV.getChildAt(row).addChild(facBox);
        });

        panel.addChild(factionGridV);

        const onFinishedButton = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.ready"));
        onFinishedButton.onClicked.add((button, player) => {
            let factions = "";
            if (persistentMemory.factions.length > 0) {
                factions = "&factions=" + persistentMemory.factions.join("|");
            }
            const customInputValue =
                sliceInput.getText().replaceAll("\\n", " ") + factions;
            const success = this._callbacks.onFinish(customInputValue, player);
            if (success) {
                this._createDraftInProgressUI(persistentMemory);
            }
        });
        const onClearButton = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.clear"));
        onClearButton.onClicked.add((button, player) => {
            this._callbacks.onClear(player);
            persistentMemory.factions = [];
            this._createCustomSelectionUI(persistentMemory);
        });
        const onCancelButton = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.cancel"));
        onCancelButton.onClicked.add((button, player) => {
            this._callbacks.onCancel(player);
            this._createDraftSettingsUI(persistentMemory);
        });
        const buttonHBox = WidgetFactory.horizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(onFinishedButton, 1)
            .addChild(onClearButton, 1)
            .addChild(onCancelButton, 1);

        panel.addChild(WidgetFactory.layoutBox(), 1);

        panel.addChild(buttonHBox);
    }

    _createDraftInProgressUI(persistentMemory) {
        const old = this._mainBox.getChild();
        if (old) {
            this._mainBox.setChild(undefined);
            WidgetFactory.release(old);
        }
        const panel = WidgetFactory.verticalBox().setChildDistance(
            CONFIG.spacing
        );
        this._mainBox.setChild(panel);

        const onCancelButton = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.cancel"));
        onCancelButton.onClicked.add((button, player) => {
            this._callbacks.onCancel(player);
            this._createDraftSettingsUI(persistentMemory);
        });

        const draftInProgress = WidgetFactory.text()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.draft.in_progress"));
        panel.addChild(draftInProgress);

        panel.addChild(WidgetFactory.layoutBox(), 1);

        panel.addChild(onCancelButton);
    }
}

module.exports = { MiltyDraftSettingsUI };
