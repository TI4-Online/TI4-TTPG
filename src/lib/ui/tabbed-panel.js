const assert = require("../../wrapper/assert-wrapper");
const CONFIG = require("../../game-ui/game-ui-config");
const {
    Border,
    Button,
    HorizontalBox,
    LayoutBox,
    VerticalBox,
    Widget,
} = require("../../wrapper/api");
const { ThrottleClickHandler } = require("./throttle-click-handler");

/**
 * Wrap Widgets inside a panel with a scrollable left-side column of tabs to select between them.
 */
class TabbedPanel {
    /**
     * Constructor.
     */
    constructor() {
        this._scale = 1;
        this._labelToGetWidget = [];
        this._createWidgetCalled = false;
    }

    setScale(scale) {
        assert(typeof scale === "number");
        this._scale = scale;

        for (let i = 0; i < Number.MAX_SAFE_INTEGER; i++) {
            const tabButton = this._tabButtons.getChildAt(i);
            if (!tabButton) {
                break;
            }
            tabButton.setFontSize(this._fontSize);
        }
        return this;
    }

    addEntry(label, getWidget) {
        assert(typeof label === "string");
        assert(typeof getWidget === "function");

        if (this._createWidgetCalled) {
            throw new Error(
                "TabbedPanel.addEntry: cannot add after calling createWidget"
            );
        }

        if (this._labelToGetWidget[label]) {
            throw new Error(`TabbedPanel.addEntry: already have "${label}"`);
        }
        this._labelToGetWidget[label] = getWidget;
    }

    createWidget() {
        this._createWidgetCalled = true;

        const left = new VerticalBox().setChildDistance(CONFIG.spacing);
        const spacer = new Border().setColor(CONFIG.spacerColor);
        const right = new LayoutBox();

        const sortedLabels = Object.keys(this._labelToGetWidget).sort();
        const leftButtons = [];
        for (const label of sortedLabels) {
            const button = new Button()
                .setFontSize(CONFIG.fontSize)
                .setText(label);
            left.addChild(button);
            leftButtons.push(button);

            button.onClicked.add(
                ThrottleClickHandler.wrap((clickedButton, player) => {
                    console.log(`TabbedPanel onClicked "${label}"`);
                    const getWidget = this._labelToGetWidget[label];
                    assert(getWidget);
                    const widget = getWidget();
                    assert(widget instanceof Widget);

                    right.setChild(widget);

                    for (const leftButton of leftButtons) {
                        leftButton.setEnabled(leftButton !== button);
                    }
                })
            );
        }

        return new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(left, 1)
            .addChild(spacer)
            .addChild(right, 2); // game ui is 4:1 nav:turns
    }
}

module.exports = { TabbedPanel };
