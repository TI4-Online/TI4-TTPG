const assert = require("../../../../wrapper/assert-wrapper");
const locale = require("../../../../lib/locale");
const {
    ThrottleClickHandler,
} = require("../../../../lib/ui/throttle-click-handler");
const CONFIG = require("../../../game-ui-config");
const {
    Border,
    Button,
    CheckBox,
    HorizontalBox,
    LayoutBox,
    Slider,
    Text,
    VerticalBox,
} = require("../../../../wrapper/api");

const SLIDER_FONT_SIZE = CONFIG.fontSize * 0.75;

class FrankenDraftSettingsUI {
    static _createSlider(params) {
        assert(typeof params.label === "string");
        assert(typeof params.min === "number");
        assert(typeof params.max === "number");
        assert(typeof params.default === "number");
        assert(typeof params.onValueChanged === "function");

        assert(params.min < params.max);
        assert(params.default >= params.min);
        assert(params.default <= params.max);

        const label = new Text()
            .setFontSize(SLIDER_FONT_SIZE)
            .setText(params.label);
        const slider = new Slider()
            .setFontSize(SLIDER_FONT_SIZE)
            .setTextBoxWidth(SLIDER_FONT_SIZE * 4)
            .setMinValue(params.min)
            .setMaxValue(params.max)
            .setStepSize(1)
            .setValue(params.default);
        slider.onValueChanged.add(params.onValueChanged);
        const panel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(label, 3)
            .addChild(slider, 2);

        return panel;
    }

    static _createCheckbox(params) {
        assert(typeof params.label === "string");
        assert(typeof params.default === "boolean");
        assert(typeof params.onCheckStateChanged === "function");

        const checkBox = new CheckBox()
            .setFontSize(SLIDER_FONT_SIZE)
            .setIsChecked(params.default)
            .setText(params.label);
        checkBox.onCheckStateChanged.add(params.onCheckStateChanged);
        return checkBox;
    }

    constructor(franken, callbacks) {
        assert(typeof callbacks.startDraft === "function");
        assert(typeof callbacks.onCancel === "function");
        assert(typeof callbacks.finishDraft === "function");

        this._draftSettings = franken.getDraftSettings();
        this._callbacks = callbacks;

        this._widget = new VerticalBox().setChildDistance(CONFIG.spacing);
        this._createDraftSettingsUI();
    }

    getWidget() {
        return this._widget;
    }

    _createDraftSettingsUI() {
        this._widget.removeAllChildren();

        const header = new Text()
            .setFontSize(SLIDER_FONT_SIZE)
            .setText(locale("franken.config"));
        this._widget.addChild(header);

        const spacer = new Border().setColor(CONFIG.spacerColor);
        this._widget.addChild(spacer);

        const columns = [
            new VerticalBox().setChildDistance(CONFIG.spacing),
            new VerticalBox().setChildDistance(CONFIG.spacing),
        ];
        const columnsPanel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing * 3)
            .addChild(columns[0], 1)
            .addChild(columns[1], 1);
        this._widget.addChild(columnsPanel, 1);

        let entries = Object.values(this._draftSettings);
        entries.sort((a, b) => {
            // Sliders first.
            if (
                typeof a.default === "boolean" &&
                typeof b.default === "number"
            ) {
                return 1;
            }
            if (
                typeof b.default === "boolean" &&
                typeof a.default === "number"
            ) {
                return -1;
            }

            // Then alpha by label.
            if (a.label === b.label) {
                return 0;
            }
            return a.label < b.label ? -1 : 1;
        });
        entries.forEach((entry, index) => {
            let widget = undefined;
            if (typeof entry.default === "number") {
                widget = FrankenDraftSettingsUI._createSlider({
                    label: entry.label,
                    min: entry.min,
                    max: entry.max,
                    default: entry.default,
                    onValueChanged: (slider, player, value) => {
                        entry._value = value;
                    },
                });
            } else if (typeof entry.default === "boolean") {
                widget = FrankenDraftSettingsUI._createCheckbox({
                    label: entry.label,
                    default: entry.default,
                    onCheckStateChanged: (checkBox, player, isChecked) => {
                        entry._value = isChecked;
                    },
                });
            } else {
                throw new Error(
                    `unknown type for "${
                        entry.label
                    }" (${typeof entry.default})`
                );
            }
            const parent =
                index < Math.ceil(entries.length / 2) ? columns[0] : columns[1];
            parent.addChild(widget);
        });

        const startDraftButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.draft.start_draft"));
        startDraftButton.onClicked.add(
            ThrottleClickHandler.wrap((button, player) => {
                const success = this._callbacks.startDraft();
                if (success) {
                    this._createDraftInProgressUI();
                }
            })
        );
        this._widget.addChild(startDraftButton);
    }

    _createDraftInProgressUI() {
        this._widget.removeAllChildren();

        const draftInProgress = new Text()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.draft.in_progress"));
        this._widget.addChild(draftInProgress);

        const finishDraftButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("franken.finish_draft"));
        finishDraftButton.onClicked.add(
            ThrottleClickHandler.wrap((button, player) => {
                this._callbacks.finishDraft();
            })
        );
        this._widget.addChild(finishDraftButton);

        const onCancelButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.button.cancel"));
        onCancelButton.onClicked.add((button, player) => {
            this._callbacks.onCancel(player);
            this._createDraftSettingsUI();
        });

        this._widget.addChild(new LayoutBox(), 1); // spacer
        this._widget.addChild(onCancelButton);
    }
}

module.exports = { FrankenDraftSettingsUI };
