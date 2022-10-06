const assert = require("../../../wrapper/assert-wrapper");
const { WhisperHistory } = require("../../../lib/whisper/whisper-history");
const CONFIG = require("../../game-ui-config");
const {
    Border,
    HorizontalBox,
    Text,
    VerticalBox,
} = require("../../../wrapper/api");

class TabWhispersUI extends VerticalBox {
    constructor() {
        super();
        this.addChild(new Text().setText("<whispers>"));
    }

    update() {}
}

module.exports = { TabWhispersUI };
