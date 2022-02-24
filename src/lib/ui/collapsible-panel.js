const assert = require("../../wrapper/assert-wrapper");
const {
    Border,
    Button,
    Text,
    VerticalBox,
    Widget,
} = require("../../wrapper/api");

/**
 * Wrap a Widget inside a panel with a "collapse/expand" toggle.
 */
class CollapsiblePanel extends Border {
    /**
     * Constructor.
     */
    constructor() {
        super();

        this._verticalBox = new VerticalBox();
        super.setChild(this._verticalBox);

        // First element is a expand/collapse button.
        this._toggleButton = new Button();
        this._toggleButton.onClicked.add((button, player) => {
            this._toggle();
        });
        this._verticalBox.addChild(this._toggleButton);

        // Second element is set by setChild.
        this._toggleChild = new Text().setText("replace me with setChild");

        // Update for current state (will add the _toggleChild then).
        this._expanded = true;
        this._update();
    }

    _toggle() {
        this._expanded = !this._expanded;
        this._update();
    }

    _update() {
        const text = this.isExpanded() ? "^" : "v";
        this._toggleButton.setText(text);

        if (this._verticalBox.getChildAt(1)) {
            this._verticalBox.removeChildAt(1);
        }
        if (this.isExpanded()) {
            this._verticalBox.addChild(this._toggleChild);
        }
    }

    /**
     * Is the child widget expanded?
     *
     * @returns {boolean}
     */
    isExpanded() {
        return this._expanded;
    }

    /**
     * Set or reset the collapsible widget.
     *
     * @param {Widget} widget
     */
    setChild(widget) {
        assert(widget instanceof Widget);
        this._toggleChild = widget;
        this._verticalBox.removeChildAt(1);
        this._verticalBox.addChild(this._toggleChild);
    }
}

module.exports = { CollapsiblePanel };
