const CONFIG = require("../../game-ui-config");
const { TextJustification } = require("../../../wrapper/api");
const { WidgetFactory } = require("../../../lib/ui/widget-factory");

class TabSecretsUI {
    constructor() {
        this._horizontalBox = WidgetFactory.horizontalBox().setChildDistance(
            CONFIG.spacing
        );

        const fontSize = CONFIG.fontSize * 0.5;
        this._columns = new Array(2).fill(0).map(() => {
            const column = WidgetFactory.text()
                .setFontSize(fontSize)
                .setJustification(TextJustification.Center)
                .setAutoWrap(true);
            this._horizontalBox.addChild(column, 1);
            return column;
        });
    }

    update(allSecretNames, scoredSecretNames) {
        this._columns.forEach((column) => column.setText(""));

        const scoredSet = new Set(scoredSecretNames);

        const count = Math.ceil(allSecretNames.length / this._columns.length);
        this._columns.forEach((column, index) => {
            const names = allSecretNames.splice(0, count);
            const value = names
                .map((name) => {
                    if (scoredSet.has(name)) {
                        return `~~${name}~~`;
                    }
                    return name;
                })
                .join("\n");
            column.setText(value);
        });
    }

    getWidget() {
        return this._horizontalBox;
    }
}

module.exports = { TabSecretsUI };
