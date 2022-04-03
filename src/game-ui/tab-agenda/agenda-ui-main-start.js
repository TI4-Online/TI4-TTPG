const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const CONFIG = require("../game-ui-config");
const {
    Button,
    HorizontalBox,
    ImageWidget,
    LayoutBox,
    Text,
    TextJustification,
    VerticalAlignment,
    VerticalBox,
    refPackageId,
} = require("../../wrapper/api");

class AgendaUiMainStart extends LayoutBox {
    constructor() {
        super();

        const text = new Text()
            .setText(locale("ui.agenda.clippy.would_you_like_help"))
            .setJustification(TextJustification.Center)
            .setFontSize(CONFIG.fontSize)
            .setAutoWrap(true);

        this._yesButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.agenda.clippy.yes"));
        this._noButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.agenda.clippy.no"));

        const leftButtons = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(this._yesButton, 1)
            .addChild(this._noButton, 1);

        const leftPanel = new VerticalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(text)

            .addChild(leftButtons);

        const mechy = new ImageWidget()
            .setImage("global/ui/mechy.png", refPackageId)
            .setImageSize(256, 256);

        const panel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(leftPanel, 1)
            .addChild(mechy, 0);

        this.setChild(panel).setVerticalAlignment(VerticalAlignment.Center);
    }

    setNext(callback) {
        assert(typeof callback === "function");
        this._yesButton.onClicked.add(callback);
        return this;
    }

    setCancel(callback) {
        assert(typeof callback === "function");
        this._noButton.onClicked.add(callback);
        return this;
    }
}

module.exports = { AgendaUiMainStart };
