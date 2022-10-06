const assert = require("../../../wrapper/assert-wrapper");
const { WhisperHistory } = require("../../../lib/whisper/whisper-history");
const CONFIG = require("../../game-ui-config");
const {
    Border,
    HorizontalBox,
    Text,
    VerticalBox,
} = require("../../../wrapper/api");

const MAX_PAIR_COUNT = 10;
const WINDOW_BUCKETS = 100;

class TabWhispersUI extends VerticalBox {
    constructor() {
        super();
        this.setChildDistance(1);

        this._windows = [];
        for (let window = 0; window < MAX_PAIR_COUNT; window++) {
            const window = [];
            const panel = new HorizontalBox().setChildDistance(1);
            this.addChild(panel);
            for (let bucket = 0; bucket < WINDOW_BUCKETS; bucket++) {
                const border = new Border().setColor([0, 0, 0, 1]);
                window.push(border);
                panel.addChild(border);
            }
            this._windows.push(window);
        }

        this.addChild(new Text().setText("<whispers>"));
        this.update();
    }

    update() {
        const whisperPairs = WhisperHistory.getAllInUpdateOrder();
        assert(Array.isArray(whisperPairs));
        whisperPairs.forEach((whisperPair, index) => {
            const window = this._windows[index];
            if (!window) {
                return; // ran past end
            }
            whisperPair.summarizeToBorders(window);
        });
    }
}

module.exports = { TabWhispersUI };
