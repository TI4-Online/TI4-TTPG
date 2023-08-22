const assert = require("../../wrapper/assert-wrapper");
const CONFIG = require("../../game-ui/game-ui-config");
const { TabbedPanel } = require("../../lib/ui/tabbed-panel");
const {
    Button,
    CheckBox,
    HorizontalBox,
    Slider,
    Text,
    VerticalBox,
} = require("../../wrapper/api");
const { ThrottleClickHandler } = require("../../lib/ui/throttle-click-handler");

/**
 * button: How-to screen brightness.
 *
 * button: How-to camera momentum.
 *
 * recommended key-binding clear: ground, z (camera), m (measure), c (hide hand)
 *
 *
 * checkbox: Turn timer.
 *
 */

class TabDisplayUI {
    constructor() {}

    createWidget(sections) {
        assert(Array.isArray(sections));

        const tabbedPanel = new TabbedPanel();

        for (const section of sections) {
            assert(typeof section.label === "string");
            assert(typeof section.description === "string");

            const getWidget = () => {
                const description = new Text()
                    .setAutoWrap(true)
                    .setFontSize(CONFIG.fontSize)
                    .setText(section.description);
                const panel = new VerticalBox()
                    .setChildDistance(CONFIG.spacing)
                    .addChild(description);
                for (const entry of section.entries) {
                    let widget;
                    if (entry.onValueChanged) {
                        widget = this._createSlider(entry);
                    } else if (entry.onCheckStateChanged) {
                        widget = this._createCheckbox(entry);
                    } else if (entry.onClicked) {
                        widget = this._createButton(entry);
                        if (entry.reset) {
                            widget.onClicked.add(
                                ThrottleClickHandler.wrap((button, player) => {
                                    tabbedPanel.resetContent();
                                })
                            );
                        }
                    } else {
                        throw new Error(
                            "TabDisplayUI.createWidget: unknown section type"
                        );
                    }
                    panel.addChild(widget);
                }
                return panel;
            };
            tabbedPanel.addEntry(section.label, getWidget);
        }

        return tabbedPanel.createWidget();
    }

    _createSlider(params) {
        assert(typeof params.label === "string");
        assert(typeof params.min === "number");
        assert(typeof params.max === "number");
        assert(!params.stepSize || typeof params.stepSize === "number");
        assert(typeof params.default === "number");
        assert(typeof params.onValueChanged === "function");

        assert(params.min <= params.max);
        assert(params.min <= params.default && params.default <= params.max);

        const label = new Text()
            .setFontSize(CONFIG.fontSize)
            .setText(params.label);
        const slider = new Slider()
            .setFontSize(CONFIG.fontSize)
            .setTextBoxWidth(CONFIG.fontSize * 4)
            .setMinValue(params.min)
            .setMaxValue(params.max)
            .setStepSize(params.stepSize ? params.stepSize : 1)
            .setValue(params.default);
        slider.onValueChanged.add(params.onValueChanged);
        const panel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(label, 1)
            .addChild(slider, 1);
        return panel;
    }

    _createCheckbox(params) {
        assert(typeof params.label === "string");
        assert(typeof params.default === "boolean");
        assert(typeof params.onCheckStateChanged === "function");

        const checkBox = new CheckBox()
            .setFontSize(CONFIG.fontSize)
            .setText(params.label)
            .setIsChecked(params.default);
        checkBox.onCheckStateChanged.add(params.onCheckStateChanged);
        return checkBox;
    }

    _createButton(params) {
        assert(typeof params.label === "string");
        assert(typeof params.onClicked === "function");

        const button = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(params.label);
        button.onClicked.add(ThrottleClickHandler.wrap(params.onClicked));
        return button;
    }
}

module.exports = { TabDisplayUI };
