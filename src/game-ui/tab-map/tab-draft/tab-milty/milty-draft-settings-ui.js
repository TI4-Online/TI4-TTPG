const assert = require("../../../../wrapper/assert-wrapper");
const locale = require("../../../../lib/locale");
const { ColorUtil } = require("../../../../lib/color/color-util");
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
    ImageButton,
    refPackageId,
    VerticalBox,
} = require("../../../../wrapper/api");
const { world, Border, Color } = require("@tabletop-playground/api");

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

        this._createDraftSettingsUI(["", []]);
    }

    _createDraftSettingsUI(persistentMemory) {
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
        const onCustomButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.custom"));
        onCustomButton.onClicked.add((button, player) => {
            this._callbacks.onCustom(player);
            persistentMemory[0] = customInput.getText();
            this._createCustomSelectionUI(persistentMemory);
        });
        const customHBox = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(customInput, 9)
            .addChild(onCustomButton, 3);
        const customInputBox = new LayoutBox()
            .setChild(customHBox)
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
        onFinishedButton.onClicked.add((button, player) => {
            console.log(customInput.getText());
            const customInputValue = customInput
                .getText()
                .replaceAll("\\n", " ");
            console.log(customInputValue);
            const success = this._callbacks.onFinish(customInputValue, player);
            if (success) {
                this._createDraftInProgressUI(persistentMemory);
            }
        });

        this.addChild(new LayoutBox(), 1);

        this.addChild(onFinishedButton);
    }

    _createCustomSelectionUI(persistentMemory) {
        this.removeAllChildren();

        const sliceInputLabel = new Text()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.draft.slice_input"));
        this.addChild(sliceInputLabel);
        const sliceInput = new MultilineTextBox()
            .setFontSize(CONFIG.fontSize)
            .setMaxLength(2000)
            .setText(persistentMemory[0]) //This fails for strings > 200char TODO: Fix/find a work around
            .setMaxLength(1000);
        const customInputBox = new LayoutBox()
            .setChild(sliceInput)
            .setMinimumHeight(CONFIG.fontSize * 2);
        this.addChild(customInputBox);

        const factionInputLabel = new Text()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.draft.faction_input"));
        this.addChild(factionInputLabel);

        const factionGridH1 = new HorizontalBox().setChildDistance(
            CONFIG.spacing * 0.75
        );
        const factionGridH2 = new HorizontalBox().setChildDistance(
            CONFIG.spacing * 0.75
        );
        const factionGridH3 = new HorizontalBox().setChildDistance(
            CONFIG.spacing * 0.75
        );
        const factionGridV = new VerticalBox()
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

        console.log(persistentMemory);

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
            if (persistentMemory[1].includes(faction.nsidName)) {
                color = new Color(1, 1, 1);
            }
            let image = faction.icon;
            if (keleresVariants.includes(faction.nsidName)) {
                image =
                    faction.icon.split("keleres")[0] +
                    faction.nsidName +
                    "_icon.png";
            }
            const factionButton = new ImageButton()
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
            const factionBorder = new Border().setColor(color);
            if (keleresVariants.includes(faction.nsidName)) {
                const keleresBorder = new Border()
                    .setChild(factionButton)
                    .setColor(
                        variantColor[keleresVariants.indexOf(faction.nsidName)]
                    );
                factionBorder.setChild(keleresBorder);
            } else {
                const exBorder = new Border()
                    .setChild(factionButton)
                    .setColor(color);
                factionBorder.setChild(exBorder);
            }

            const facName = new Text()
                .setFontSize(CONFIG.fontSize * 0.35)
                .setJustification(2)
                .setText(faction.nameAbbr);
            const facVBox = new VerticalBox()
                .setHorizontalAlignment(2)
                .setChildDistance(CONFIG.spacing * 0)
                .addChild(factionBorder)
                .addChild(facName);
            const facBox = new LayoutBox()
                .setOverrideWidth(150)
                .setChild(facVBox);

            let row = itr / colLen;
            itr = itr + 1;
            factionGridV.getChildAt(row).addChild(facBox);
        });

        this.addChild(factionGridV);

        const onFinishedButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.ready"));
        onFinishedButton.onClicked.add((button, player) => {
            let factions = "";
            if (persistentMemory[1].length > 0) {
                factions = "&factions=" + persistentMemory[1].join("|");
            }
            const customInputValue =
                sliceInput.getText().replaceAll("\\n", " ") + factions;
            const success = this._callbacks.onFinish(customInputValue, player);
            if (success) {
                this._createDraftInProgressUI(persistentMemory);
            }
        });
        const onClearButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.clear"));
        onClearButton.onClicked.add((button, player) => {
            this._callbacks.onClear(player);
            this._createCustomSelectionUI([sliceInput.getText(), []]);
        });
        const onCancelButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.cancel"));
        onCancelButton.onClicked.add((button, player) => {
            this._callbacks.onCancel(player);
            this._createDraftSettingsUI(persistentMemory);
        });
        const buttonHBox = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(onFinishedButton, 1)
            .addChild(onClearButton, 1)
            .addChild(onCancelButton, 1);

        this.addChild(new LayoutBox(), 1);

        this.addChild(buttonHBox);
    }

    _createDraftInProgressUI(persistentMemory) {
        this.removeAllChildren();

        const onCancelButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.cancel"));
        onCancelButton.onClicked.add((button, player) => {
            this._callbacks.onCancel(player);
            this._createDraftSettingsUI(persistentMemory);
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
