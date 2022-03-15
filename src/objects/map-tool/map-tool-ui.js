const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const {
    Button,
    LayoutBox,
    MultilineTextBox,
    VerticalBox,
} = require("../../wrapper/api");

class MapToolUI extends VerticalBox {
    constructor(onButtonCallbacks) {
        super();

        this.setChildDistance(5);

        this._mapStringTextBox = new MultilineTextBox().setMaxLength(1000);
        const mapStringLayoutBox = new LayoutBox()
            .setChild(this._mapStringTextBox)
            .setMinimumHeight(50);
        this.addChild(mapStringLayoutBox);

        const addButton = (localeText, onClickHandler) => {
            const button = new Button().setText(locale(localeText));
            button.onClicked.add(onClickHandler);
            this.addChild(button);
        };

        const f = onButtonCallbacks;
        addButton("ui.maptool.clear", f.clear);
        addButton("ui.maptool.save", f.save);
        addButton("ui.maptool.load", f.load);
        addButton("ui.maptool.place_cards", f.placeCards);
        addButton("ui.maptool.clear_cards", f.clearCards);
        addButton("ui.maptool.place_frontier_tokens", f.placeFrontierTokens);
        addButton("ui.maptool.clear_frontier_tokens", f.clearFrontierTokens);
        addButton("ui.maptool.place_hyperlanes", f.placeHyperlanes);
    }

    getMapString() {
        return this._mapStringTextBox.getText();
    }

    /**
     * Set the map string in the text box.
     * @param {string} value
     */
    setMapString(value) {
        assert(typeof value === "string");
        console.log(`MapToolUI.setMapString("${value}") |s|=${value.length}`);
        this._mapStringTextBox.setText(value);
    }
}

module.exports = { MapToolUI };
