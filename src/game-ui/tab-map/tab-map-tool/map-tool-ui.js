const assert = require("../../../wrapper/assert-wrapper");
const locale = require("../../../lib/locale");
const CONFIG = require("../../game-ui-config");
const {
    Button,
    HorizontalBox,
    LayoutBox,
    MultilineTextBox,
    Text,
    VerticalBox,
} = require("../../../wrapper/api");

class MapToolUI extends VerticalBox {
    constructor(onButtonCallbacks) {
        super();

        this.setChildDistance(CONFIG.spacing);

        const customInputLabel = new Text()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.maptool.map_string"));
        this.addChild(customInputLabel);

        this._mapStringTextBox = new MultilineTextBox()
            .setFontSize(CONFIG.fontSize)
            .setMaxLength(1000);
        const mapStringLayoutBox = new LayoutBox()
            .setChild(this._mapStringTextBox)
            .setMinimumHeight(CONFIG.fontSize * 4);
        this.addChild(mapStringLayoutBox);

        let panel = false;

        const addRow = () => {
            panel = new HorizontalBox().setChildDistance(CONFIG.spacing);
            this.addChild(panel);
        };

        const addButton = (localeText, onClickHandler) => {
            assert(typeof localeText === "string");
            assert(typeof onClickHandler === "function");
            const button = new Button()
                .setText(locale(localeText))
                .setFontSize(CONFIG.fontSize);
            button.onClicked.add(onClickHandler);
            panel.addChild(button, 1);
        };

        const f = onButtonCallbacks;

        addRow();
        addButton("ui.maptool.load", f.load);
        addButton("ui.maptool.save", f.save);

        addRow();
        addButton("ui.maptool.place_cards", f.placeCards);
        addButton("ui.maptool.clear_cards", f.clearCards);

        addRow();
        addButton("ui.maptool.place_frontier_tokens", f.placeFrontierTokens);
        addButton("ui.maptool.clear_frontier_tokens", f.clearFrontierTokens);

        addRow();
        addButton("ui.maptool.place_hyperlanes", f.placeHyperlanes);
        addButton("ui.maptool.clear", f.clear);
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
