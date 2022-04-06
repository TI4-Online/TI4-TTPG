const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const CONFIG = require("../game-ui-config");
const {
    Border,
    Button,
    CheckBox,
    LayoutBox,
    Rotator,
    Text,
    TextJustification,
    UIElement,
    Vector,
    VerticalBox,
    world,
} = require("../../wrapper/api");

/**
 * Per-desk "any whens / afters?" UI.  Note that zones do not hide world UI.
 * TTPG may offer screen space and/or more visibility control in the future.
 */
class AgendaUiDeskWhenAfter extends Border {
    constructor(playerDesk, isWhen) {
        assert(playerDesk);
        assert(typeof isWhen === "boolean");
        super();

        this._playerDesk = playerDesk;
        this._isWhen = isWhen;

        // Always display any X, players may commit early.
        this._anyWhens = new CheckBox()
            .setText(locale("ui.agenda.clippy.any_whens"))
            .setFontSize(CONFIG.fontSize)
            .setIsChecked(true);
        this._anyAfters = new CheckBox()
            .setText(locale("ui.agenda.clippy.any_afters"))
            .setFontSize(CONFIG.fontSize)
            .setIsChecked(true);

        // Only enable if current turn.
        const currentDesk = world.TI4.turns.getCurrentTurn();
        this._playPredictOutcome = new Button()
            .setText(locale("ui.agenda.clippy.play_predict"))
            .setFontSize(CONFIG.fontSize);
        this._playOther = new Button()
            .setText(locale("ui.agenda.clippy.play_other"))
            .setFontSize(CONFIG.fontSize);

        const playerName = currentDesk.colorName;
        this._waitingFor = new Text()
            .setText(
                locale("ui.agenda.clippy.waiting_for_player_name", {
                    playerName,
                })
            )
            .setJustification(TextJustification.Center)
            .setFontSize(CONFIG.fontSize)
            .setAutoWrap(true);

        const panel = new VerticalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(this._anyWhens)
            .addChild(this._anyAfters)
            .addChild(this._playPredictOutcome)
            .addChild(this._playOther)
            .addChild(this._waitingFor);
        const panelBox = new LayoutBox()
            .setPadding(
                CONFIG.padding,
                CONFIG.padding,
                CONFIG.padding,
                CONFIG.padding
            )
            .setChild(panel);
        this.setChild(panelBox);

        const localPos = new Vector(30, 0, 20);
        const localRot = new Rotator(25, 0, 0);
        this._ui = new UIElement();
        this._ui.position = playerDesk.localPositionToWorld(localPos);
        this._ui.rotation = playerDesk.localRotationToWorld(localRot);
        this._ui.widget = this;

        this.update();
    }

    get anyWhens() {
        return this._anyWhens;
    }

    get anyAfters() {
        return this._anyAfters;
    }

    get playPredictOutcome() {
        return this._playPredictOutcome;
    }

    get playOther() {
        return this._playOther;
    }

    attach() {
        world.addUI(this._ui);
        return this;
    }

    detach() {
        world.removeUIElement(this._ui);
        return this;
    }

    update() {
        const currentDesk = world.TI4.turns.getCurrentTurn();
        const playerName = currentDesk.colorName;
        this._waitingFor.setText(
            locale("ui.agenda.clippy.waiting_for_player_name", {
                playerName,
            })
        );
        this._playPredictOutcome.setEnabled(
            currentDesk === this._playerDesk && !this._isWhen
        );
        this._playOther.setEnabled(currentDesk === this._playerDesk);
    }
}

module.exports = { AgendaUiDeskWhenAfter };
