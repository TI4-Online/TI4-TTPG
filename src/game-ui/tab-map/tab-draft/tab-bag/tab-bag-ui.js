const CONFIG = require("../../../game-ui-config");
const { Text, VerticalBox } = require("../../../../wrapper/api");

class TabBagDraftUI extends VerticalBox {
    constructor(onClickHandlers) {
        super();

        this.setChildDistance(CONFIG.spacing);
        this.addChild(
            new Text().setFontSize(CONFIG.fontSize).setText("PENDING")
        );
    }
}

module.exports = { TabBagDraftUI };
