const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const CONFIG = require("../game-ui-config");
const {
    Border,
    Button,
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
 * Per-desk predict/vote display.
 *
 * <label><edit button> [total] [per-player votes +/-]
 */
class AgendaUiDeskPredictVote extends Border {
    constructor(playerDesk, outcomes) {
        assert(playerDesk);
        assert(outcomes);
        super();

        // Outcomes are always text, either fixed or editable.
        // Use a select button to choose.
        // Show prediction/votes next to it.

        // Only enable if current turn.
        const currentDesk = world.TI4.turns.getCurrentTurn();
        this._playPredictOutcome = new Button()
            .setText(locale("ui.agenda.clippy.play_predict"))
            .setFontSize(CONFIG.fontSize)
            .setEnabled(currentDesk === playerDesk && !this._isWhen);
        this._playOther = new Button()
            .setText(locale("ui.agenda.clippy.play_other"))
            .setFontSize(CONFIG.fontSize)
            .setEnabled(currentDesk === playerDesk);

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
            .addChild(this._playCard)
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
    }
}

module.exports = { AgendaUiDeskPredictVote };
