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
        this._tabs = new HorizontalBox();
        this._verticalBox.addChild(this._tabs);
    }

    addTab(label, widget) {
        assert(typeof label === "string");
        assert(widget instanceof Widget);

        const tabButton = new Button().setText(label);
        tabButton.onClicked.add((button, player) => {
            if (this._verticalBox.getChildAt(1)) {
                this._verticalBox.removeChildAt(1);
            }
            this._verticalBox.addChild(widget);
        });

        const weight = 1; // make all same width
        this._tabs.addChild(tabButton, weight);

        // If this is the first tab, set it visible.
        if (!this._verticalBox.getChildAt(1)) {
            this._verticalBox.addChild(widget);
        }

        return this;
    }

    setChild(widget) {
        throw new Error("use addTab");
    }
}

module.exports = { TabbedPanel };
