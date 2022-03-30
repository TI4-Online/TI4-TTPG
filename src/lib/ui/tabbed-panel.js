const assert = require("../../wrapper/assert-wrapper");
const {
    Button,
    HorizontalBox,
    LayoutBox,
    VerticalBox,
    Widget,
} = require("../../wrapper/api");

/**
 * Wrap Widgets inside a panet with top-row of tabs to select between them.
 */
class TabbedPanel extends LayoutBox {
    /**
     * Constructor.
     */
    constructor(includeCollapseButton) {
        super();

        this._fontSize = undefined;

        this._verticalBox = new VerticalBox();
        super.setChild(this._verticalBox);

        // First element is tabs.
        this._tabButtons = new HorizontalBox();
        this._verticalBox.addChild(this._tabButtons);

        this._labelToTabData = {};

        if (includeCollapseButton) {
            const collapseButton = new Button().setText("X");
            collapseButton.onClicked.add((button, player) => {
                if (this._verticalBox.getChildAt(1)) {
                    this._verticalBox.removeChildAt(1);
                }
                for (const tabData of Object.values(this._labelToTabData)) {
                    tabData.tabButton.setEnabled(true);
                }
            });
            this._tabButtons.addChild(collapseButton);
        }
    }

    setFontSize(value) {
        assert(typeof value === "number");
        this._fontSize = value;

        for (let i = 0; i < Number.MAX_SAFE_INTEGER; i++) {
            const tabButton = this._tabButtons.getChildAt(i);
            if (!tabButton) {
                break;
            }
            tabButton.setFontSize(this._fontSize);
        }
        return this;
    }

    setSpacing(value) {
        this._verticalBox.setChildDistance(value);
        this._tabButtons.setChildDistance(value);
        return this;
    }

    selectTab(label) {
        const tab = this._labelToTabData[label];
        assert(tab);

        // Enable other tabs.
        for (const tabData of Object.values(this._labelToTabData)) {
            tabData.tabButton.setEnabled(tabData.label !== label);
        }

        // Show tab content.
        if (this._verticalBox.getChildAt(1)) {
            this._verticalBox.removeChildAt(1);
        }
        assert(tab.widget);
        this._verticalBox.addChild(tab.widget, 1);
    }

    addTab(label, widget, selectThisTab) {
        assert(typeof label === "string" && label.length > 0);
        assert(widget instanceof Widget);

        const tabButton = new Button().setText(label);
        if (this._fontSize) {
            tabButton.setFontSize(this._fontSize);
        }
        tabButton.onClicked.add((button, player) => {
            this.selectTab(label);
        });

        const weight = 1; // make all same width
        this._tabButtons.addChild(tabButton, weight);

        if (this._labelToTabData[label]) {
            throw new Error(`already have tab "${label}"`);
        }
        this._labelToTabData[label] = {
            label,
            tabButton,
            widget,
        };

        if (selectThisTab) {
            this.selectTab(label);
        }

        return this;
    }

    setChild(widget) {
        throw new Error("use addTab");
    }
}

module.exports = { TabbedPanel };
