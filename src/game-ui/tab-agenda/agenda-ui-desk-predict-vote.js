const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const CONFIG = require("../game-ui-config");
const { AgendaOutcome } = require("./agenda-outcome");
const {
    Border,
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
        assert(Array.isArray(outcomes));
        outcomes.forEach((outcome) => {
            assert(outcome instanceof AgendaOutcome);
        });

        super();
        this._playerDesk = playerDesk;

        // Outcomes are always text, either fixed or editable.
        // Use a select button to choose.
        // Show prediction/votes next to it.

        const currentDesk = world.TI4.turns.getCurrentTurn();
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

        const [outcomesWidget, commitButton] = AgendaOutcome.formatOutcomes(
            outcomes,
            playerDesk
        );
        this._commitButton = commitButton;
        this._commitButton.onClicked.add((button, player) => {
            world.TI4.turns.endTurn(player);
        });

        const panel = new VerticalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(outcomesWidget)
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

        outcomes.forEach((outcome) => {
            outcome.linkUI(playerDesk.index, this._ui);
        });

        this.update();
    }

    attach() {
        world.addUI(this._ui);
        return this;
    }

    detach() {
        world.removeUIElement(this._ui);
        return this;
    }

    get commitButton() {
        return this._commitButton;
    }

    update() {
        const currentDesk = world.TI4.turns.getCurrentTurn();
        const playerName = currentDesk.colorName;
        this._waitingFor.setText(
            locale("ui.agenda.clippy.waiting_for_player_name", {
                playerName,
            })
        );
        this._commitButton.setEnabled(currentDesk === this._playerDesk);
    }
}

module.exports = { AgendaUiDeskPredictVote };
