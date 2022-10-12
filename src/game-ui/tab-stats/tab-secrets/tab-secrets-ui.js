const CONFIG = require("../../game-ui-config");
const {
    HorizontalBox,
    Text,
    TextJustification,
} = require("../../../wrapper/api");

class TabSecretsUI extends HorizontalBox {
    constructor() {
        super();

        this.setChildDistance(CONFIG.spacing);

        const fontSize = CONFIG.fontSize * 0.5;
        this._columns = new Array(2).fill(0).map(() => {
            const column = new Text()
                .setFontSize(fontSize)
                .setJustification(TextJustification.Center)
                .setAutoWrap(true);
            this.addChild(column, 1);
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
}

module.exports = { TabSecretsUI };
