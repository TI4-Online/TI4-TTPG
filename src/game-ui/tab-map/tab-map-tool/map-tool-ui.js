const assert = require("../../../wrapper/assert-wrapper");
const locale = require("../../../lib/locale");
const CONFIG = require("../../game-ui-config");
const { WidgetFactory } = require("../../../lib/ui/widget-factory");

class MapToolUI {
    constructor(onButtonCallbacks) {
        this._verticalBox = WidgetFactory.verticalBox().setChildDistance(
            CONFIG.spacing
        );

        const customInputLabel = WidgetFactory.text()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.maptool.map_string"));
        this._verticalBox.addChild(customInputLabel);

        this._mapStringTextBox = WidgetFactory.multilineTextBox()
            .setFontSize(CONFIG.fontSize)
            .setMaxLength(1000);
        const mapStringLayoutBox = WidgetFactory.layoutBox()
            .setChild(this._mapStringTextBox)
            .setMinimumHeight(CONFIG.fontSize * 3);
        this._verticalBox.addChild(mapStringLayoutBox);

        let panel = false;

        const addRow = () => {
            panel = WidgetFactory.horizontalBox().setChildDistance(
                CONFIG.spacing
            );
            this._verticalBox.addChild(panel);
        };

        const addButton = (localeText, onClickHandler) => {
            assert(typeof localeText === "string");
            assert(typeof onClickHandler === "function");
            const button = WidgetFactory.button()
                .setText(locale(localeText))
                .setFontSize(CONFIG.fontSize);
            button.onClicked.add(onClickHandler);
            panel.addChild(button, 1);
            return button;
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

    getWidget() {
        return this._verticalBox;
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
