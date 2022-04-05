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
    world,
} = require("../../wrapper/api");

const OUTCOME_TYPE = {
    FOR_AGAINST: "for/against",
    PLAYER: "player",
    OTHER: "other",
};

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

class AgendaUiMainOutcomeType extends LayoutBox {
    static getDefaultOutcomes(outcomeType) {
        assert(typeof outcomeType === "string");
        switch (outcomeType) {
            case OUTCOME_TYPE.FOR_AGAINST:
                return [
                    locale("ui.agenda.outcome.for"),
                    locale("ui.agenda.outcome.against"),
                ];
            case OUTCOME_TYPE.PLAYER:
                return world.TI4.getAllPlayerDesks().map((desk) => {
                    return capitalizeFirstLetter(desk.colorName);
                });
            case OUTCOME_TYPE.OTHER:
                return world.TI4.getAllPlayerDesks().map((desk) => {
                    return "???";
                });
        }
    }

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
            .setText(locale("ui.agenda.outcome_type.for_against"));
        outcomeForAgainstButton.onClicked.add((button, player) => {
            this._outcomeTypeListener(OUTCOME_TYPE.FOR_AGAINST);
            this._onNext();
        });
        const outcomePlayerButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.agenda.outcome_type.player"));
        outcomePlayerButton.onClicked.add((button, player) => {
            this._outcomeTypeListener(OUTCOME_TYPE.PLAYER);
            this._onNext();
        });
        const outcomeOtherButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.agenda.outcome_type.other"));
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
