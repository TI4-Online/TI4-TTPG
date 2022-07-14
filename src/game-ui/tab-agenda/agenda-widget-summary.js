const locale = require("../../lib/locale");
const CONFIG = require("../../game-ui/game-ui-config");
const { AgendaUiDesk } = require("./agenda-ui-desk");
const {
    Border,
    HorizontalBox,
    Text,
    TextJustification,
    VerticalBox,
    globalEvents,
    world,
} = require("../../wrapper/api");

let _agendaWidgetSummary = undefined;

globalEvents.TI4.onAgendaPlayerStateChanged.add(() => {
    if (!_agendaWidgetSummary) {
        return; // no active summary
    }
    if (!_agendaWidgetSummary.getParent()) {
        _agendaWidgetSummary = undefined;
        return; // orphaned summary, release reference
    }
    _agendaWidgetSummary._updateUI();
});

/**
 * Agenda phase summary, used for main UI (streamer request).
 * Can handle
 */
class AgendaWidgetSummary extends VerticalBox {
    constructor() {
        super();
        this.setChildDistance(CONFIG.spacing);

        this._createUI();
        this._updateUI();

        // Track one to get update events.
        _agendaWidgetSummary = this;
    }

    _createUI() {
        const agenda = world.TI4.agenda;

        let fontSize = CONFIG.fontSize;
        const fitOutcomes = 5.8;
        if (agenda.getNumOutcomes() > fitOutcomes) {
            fontSize = (fontSize * fitOutcomes) / agenda.getNumOutcomes();
        }

        const availableVotes =
            AgendaUiDesk.createAvailabledVotesWidget(fontSize);
        this.addChild(availableVotes);
        this.addChild(new Border().setColor(CONFIG.spacerColor));

        this._outcomeData = [];

        const colName = new VerticalBox().setChildDistance(CONFIG.spacing);
        const colVotes = new VerticalBox().setChildDistance(CONFIG.spacing);
        const colPredictions = new VerticalBox().setChildDistance(
            CONFIG.spacing
        );

        colName.addChild(
            new Text()
                .setFontSize(fontSize)
                .setBold(true)
                .setText(locale("ui.agenda.label.outcomes"))
        );
        colVotes.addChild(
            new Text()
                .setFontSize(fontSize)
                .setBold(true)
                .setText(locale("ui.agenda.label.votes"))
        );
        colPredictions.addChild(
            new Text()
                .setFontSize(fontSize)
                .setBold(true)
                .setText(locale("ui.agenda.label.predictions"))
        );

        for (
            let outcomeIndex = 0;
            outcomeIndex < agenda.getNumOutcomes();
            outcomeIndex++
        ) {
            const outcomeName = agenda.getOutcomeName(outcomeIndex);
            const nameText = new Text()
                .setFontSize(fontSize)
                .setText(outcomeName);
            colName.addChild(nameText);

            const voteTotalText = new Text()
                .setFontSize(fontSize)
                .setText(" [0] ");

            const votePanel = new HorizontalBox().addChild(voteTotalText);
            const voteTexts = [];
            for (const playerDesk of world.TI4.getAllPlayerDesks()) {
                const voteText = new Text()
                    .setFontSize(fontSize)
                    .setTextColor(playerDesk.color)
                    .setText("");
                votePanel.addChild(voteText);
                voteTexts.push(voteText);
            }
            colVotes.addChild(votePanel);

            const predictionPanel = new HorizontalBox();
            const predictionTexts = [];
            for (const playerDesk of world.TI4.getAllPlayerDesks()) {
                const predictionText = new Text()
                    .setFontSize(fontSize)
                    .setTextColor(playerDesk.color)
                    .setText("");
                predictionPanel.addChild(predictionText);
                predictionTexts.push(predictionText);
            }
            colPredictions.addChild(predictionPanel);

            this._outcomeData.push({
                nameText,
                voteTotalText,
                voteTexts,
                predictionTexts,
            });
        }

        const box = new HorizontalBox()
            .setChildDistance(CONFIG.spacing * 3)
            .addChild(colName)
            .addChild(colVotes)
            .addChild(colPredictions);
        this.addChild(box);

        this.addChild(new Border().setColor(CONFIG.spacerColor));

        const playerName = "?";
        this._waitingFor = new Text()
            .setText(
                locale("ui.agenda.clippy.waiting_for_player_name", {
                    playerName,
                })
            )
            .setJustification(TextJustification.Center)
            .setFontSize(fontSize);

        this.addChild(this._waitingFor);
    }

    _updateUI() {
        const agenda = world.TI4.agenda;
        let msg;

        for (
            let outcomeIndex = 0;
            outcomeIndex < agenda.getNumOutcomes();
            outcomeIndex++
        ) {
            const outcome = this._outcomeData[outcomeIndex];
            outcome.nameText.setText(agenda.getOutcomeName(outcomeIndex));

            let total = 0;
            const peerCount = world.TI4.config.playerCount;
            for (let peerIndex = 0; peerIndex < peerCount; peerIndex++) {
                msg = "";
                const peerOutcomeIndex = agenda.getVoteOutcomeIndex(peerIndex);
                if (peerOutcomeIndex === outcomeIndex) {
                    const votes = agenda.getVoteCount(peerIndex);
                    if (votes > 0) {
                        total += votes;
                        msg = `${votes} `;
                    }
                }
                outcome.voteTexts[peerIndex].setText(msg);
            }
            outcome.voteTotalText.setText(` [${total}] `);

            for (let peerIndex = 0; peerIndex < peerCount; peerIndex++) {
                msg = "";
                const predictions = agenda.getPredictionCount(
                    peerIndex,
                    outcomeIndex
                );
                if (predictions > 0) {
                    msg = new Array(predictions + 1).join("X");
                }
                outcome.predictionTexts[peerIndex].setText(msg);
            }
        }

        // Waiting for.
        const stateMachine = agenda.getStateMachine();
        const state = stateMachine && stateMachine.name;
        msg = "ui.agenda.clippy.waiting_for_player_name"; // generic
        if (state === "WHEN") {
            msg = "ui.agenda.clippy.waiting_whens";
        } else if (state === "AFTER") {
            msg = "ui.agenda.clippy.waiting_afters";
        } else if (state === "VOTE") {
            msg = "ui.agenda.clippy.waiting_vote";
        }
        const currentDesk = world.TI4.turns.getCurrentTurn();
        const playerName = currentDesk.colorName;
        this._waitingFor.setText(
            locale(msg, {
                playerName,
            })
        );
    }
}

module.exports = { AgendaWidgetSummary };
