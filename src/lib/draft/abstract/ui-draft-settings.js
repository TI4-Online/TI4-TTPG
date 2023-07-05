const assert = require("../../../wrapper/assert-wrapper");
const locale = require("../../locale");
const { AbstractSliceDraft } = require("./abstract-slice-draft");
const { UiMap } = require("./ui-map");
const CONFIG = require("../../../game-ui/game-ui-config");
const {
    CheckBox,
    EditText,
    HorizontalAlignment,
    HorizontalBox,
    LayoutBox,
    Slider,
    Text,
    VerticalAlignment,
    VerticalBox,
    refPackageId,
    world,
} = require("../../../wrapper/api");

class UiDraftSettings {
    constructor(sliceDraft) {
        assert(sliceDraft instanceof AbstractSliceDraft);
        this._sliceDraft = sliceDraft;
    }

    getWidget() {
        // Max player count?
        const playerCount = world.TI4.config.playerCount;
        const maxPlayerCount = this._sliceDraft.getMaxPlayerCount();
        if (playerCount > maxPlayerCount) {
            const msg = locale("ui.draft.too_many_players", { playerCount });
            return new Text()
                .setAutoWrap(true)
                .setFontSize(CONFIG.fontSize)
                .setText(msg);
        }

        const panel = new VerticalBox().setChildDistance(CONFIG.spacing);

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

        // Use faction cards on table?
        const useFactionsOnTable = UiDraftSettings._createCheckbox({
            name: locale("ui.draft.factions_from_cards_short"),
            default: false,
            onCheckStateChanged: () => {},
        });
        panel.addChild(useFactionsOnTable);

        const useHomeSystems = false;
        const { mapString, deskIndexToLabel } = UiMap.generateMapString(
            this._sliceDraft,
            useHomeSystems
        );
        const map = new UiMap()
            .setMapString(mapString)
            .setScale(1.5)
            .createWidget();
        const mapBox = new LayoutBox()
            .setVerticalAlignment(VerticalAlignment.Center)
            .setHorizontalAlignment(HorizontalAlignment.Center)
            .setChild(map);

        return new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(panel, 2)
            .addChild(mapBox, 1);
    }

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
            .setValue(params.default);
        slider.onValueChanged.add(params.onValueChanged);
        const panel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(label, 1)
            .addChild(slider, 1);
        return panel;
    }
}

module.exports = { UiDraftSettings };
