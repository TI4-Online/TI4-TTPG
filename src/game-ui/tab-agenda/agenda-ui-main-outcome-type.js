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

const OUTCOME_TYPE = {
    FOR_AGAINST: "for/against",
    PLAYER: "player",
    OTHER: "other",
};

class AgendaUiMainOutcomeType extends LayoutBox {
    constructor() {
        super();

        this._outcomeTypeListener = () => {};
        this._onNext = () => {};

        const text = new Text()
            .setText(locale("ui.agenda.clippy.outcome_category"))
            .setJustification(TextJustification.Center)
            .setFontSize(CONFIG.fontSize)
            .setAutoWrap(true);

        const outcomeForAgainstButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.agenda.outcome.for_against"));
        outcomeForAgainstButton.onClicked.add((button, player) => {
            this._outcomeTypeListener(OUTCOME_TYPE.FOR_AGAINST);
            this._onNext();
        });
        const outcomePlayerButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.agenda.outcome.player"));
        outcomePlayerButton.onClicked.add((button, player) => {
            this._outcomeTypeListener(OUTCOME_TYPE.PLAYER);
            this._onNext();
        });
        const outcomeOtherButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.agenda.outcome.other"));
        outcomeOtherButton.onClicked.add((button, player) => {
            this._outcomeTypeListener(OUTCOME_TYPE.OTHER);
            this._onNext();
        });

        const leftPanel = new VerticalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(text)
            .addChild(outcomeForAgainstButton)
            .addChild(outcomePlayerButton)
            .addChild(outcomeOtherButton);

        const mechy = new ImageWidget()
            .setImage("global/ui/mechy.png", refPackageId)
            .setImageSize(256, 256);

        const panel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(leftPanel, 1)
            .addChild(mechy, 0);

        this.setChild(panel).setVerticalAlignment(VerticalAlignment.Center);
    }

    setOutcomeTypeListener(listener) {
        assert(typeof listener === "function");
        this._outcomeTypeListener = listener;
        return this;
    }

    setNext(callback) {
        assert(typeof callback === "function");
        this._onNext = callback;
        return this;
    }
}

module.exports = { AgendaUiMainOutcomeType, OUTCOME_TYPE };
