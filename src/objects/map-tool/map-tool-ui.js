const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const {
    Border,
    Button,
    GameObject,
    MultilineTextBox,
    UIElement,
    Vector,
    VerticalBox,
} = require("../../wrapper/api");

class MapToolUI {
    constructor(gameObject, onButtonMap) {
        assert(gameObject instanceof GameObject);

        this._obj = gameObject;
        this._onButtonMap = onButtonMap;

        this._mapStringTextBox = new MultilineTextBox().setMaxLength(1000);

        this._uiElement = new UIElement();
        this._uiElement.position = new Vector(0, 0, 5);

        this._uiElement.widget = new Border();
        this._obj.addUI(this._uiElement);

        this.reset();
    }

    getMapString() {
        return this._mapStringTextBox.getText();
    }

    setMapString(value) {
        assert(typeof value === "string");
        console.log(`MapToolUI.setMapString("${value}") |s|=${value.length}`);

        this._mapStringTextBox.setText(value);
        this._obj.updateUI(this._mapStringTextBox);
    }

    reset() {
        const panel = new VerticalBox().setChildDistance(5);

        panel.addChild(this._mapStringTextBox);

        const addButton = (localeText, onClickHandler) => {
            const button = new Button().setText(locale(localeText));
            button.onClicked.add(onClickHandler);
            panel.addChild(button);
        };

        const f = this._onButtonMap;
        addButton("ui.maptool.clear", f.clear);
        addButton("ui.maptool.save", f.save);
        addButton("ui.maptool.load", f.load);
        addButton("ui.maptool.place_cards", f.placeCards);
        addButton("ui.maptool.clear_cards", f.clearCards);
        addButton("ui.maptool.place_frontier_tokens", f.placeFrontierTokens);
        addButton("ui.maptool.clear_frontier_tokens", f.clearFrontierTokens);

        // GameObject.updateUI does NOT update if you change the widget.
        this._uiElement.widget = new Border().setChild(panel);
        this._obj.removeUI(this._uiElement);
        this._obj.addUI(this._uiElement);
    }
}

module.exports = { MapToolUI };
