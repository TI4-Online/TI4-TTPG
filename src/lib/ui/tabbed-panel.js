const assert = require("../../wrapper/assert-wrapper");
const {
    Border,
    Button,
    HorizontalBox,
    VerticalBox,
    Widget,
} = require("../../wrapper/api");

/**
 * Wrap Widgets inside a panet with top-row of tabs to select between them.
 */
class TabbedPanel extends Border {
    /**
     * Constructor.
     */
    constructor() {
        super();

        this._verticalBox = new VerticalBox();
        super.setChild(this._verticalBox);

        // First element is tabs.
        this._tabButtons = new HorizontalBox();
        this._verticalBox.addChild(this._tabButtons);

        this._labelToTabData = {};
    }

    _selectTab(label) {
        console.log(`TabbedPanel._selectTab("${label}")`);
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
        this._verticalBox.addChild(tab.widget);
    }

    addTab(label, widget) {
        assert(typeof label === "string" && label.length > 0);
        assert(widget instanceof Widget);

        const tabButton = new Button().setText(label);
        tabButton.onClicked.add((button, player) => {
            this._selectTab(label);
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

        // If this is the first tab, set it visible.
        if (!this._verticalBox.getChildAt(1)) {
            this._selectTab(label);
        }

        return this;
    }

    setChild(widget) {
        throw new Error("use addTab");
    }
}

module.exports = { TabbedPanel };
