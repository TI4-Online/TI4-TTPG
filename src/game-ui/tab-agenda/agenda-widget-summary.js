const locale = require("../../lib/locale");
const CONFIG = require("../../game-ui/game-ui-config");
const { AgendaCardWidget } = require("../../lib/agenda/agenda-card-widget");
const {
    AgendaWidgetAvailableVotes,
} = require("./agenda-widget-available-votes");
const {
    HorizontalAlignment,
    HorizontalBox,
    TextJustification,
    VerticalAlignment,
    globalEvents,
    world,
} = require("../../wrapper/api");
const { WidgetFactory } = require("../../lib/ui/widget-factory");

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
class AgendaWidgetSummary extends HorizontalBox {
    constructor() {
        super();
        this.setChildDistance(CONFIG.spacing * 3);

        this._createUI();
        this._updateUI();

        // Track one to get update events.
        _agendaWidgetSummary = this;
    }

    _createUI() {
        const agenda = world.TI4.agenda;

        const card = world.TI4.agenda.getAgendaCard();
        if (card) {
            const leftPanel = new AgendaCardWidget(card);
            const width = 200 * CONFIG.scale;
            leftPanel.setImageSize(width, (width * 750) / 500);
            const leftBox = WidgetFactory.layoutBox()
                .setChild(leftPanel)
                .setVerticalAlignment(VerticalAlignment.Center)
                .setHorizontalAlignment(HorizontalAlignment.Center);
            this.addChild(leftBox, 0);
        }

        let fontSize = CONFIG.fontSize;
        const fitOutcomes = 5;
        if (agenda.getNumOutcomes() > fitOutcomes) {
            fontSize = (fontSize * fitOutcomes) / agenda.getNumOutcomes();
        }

        const rightPanel = WidgetFactory.verticalBox().setChildDistance(
            CONFIG.spacing
        );

        const deskIndex = -1; // not a desk
        const availableVotes = new AgendaWidgetAvailableVotes(
            fontSize,
            deskIndex
        ).addResetButton();
        rightPanel.addChild(availableVotes);
        rightPanel.addChild(
            WidgetFactory.border().setColor(CONFIG.spacerColor)
        );

        this._outcomeData = [];

        const colName = WidgetFactory.verticalBox().setChildDistance(
            CONFIG.spacing
        );
        const colVotes = WidgetFactory.verticalBox().setChildDistance(
            CONFIG.spacing
        );
        const colPredictions = WidgetFactory.verticalBox().setChildDistance(
            CONFIG.spacing
        );

        colName.addChild(
            WidgetFactory.text()
                .setFontSize(fontSize)
                .setBold(true)
                .setText(locale("ui.agenda.label.outcomes"))
        );
        colVotes.addChild(
            WidgetFactory.text()
                .setFontSize(fontSize)
                .setBold(true)
                .setText(locale("ui.agenda.label.votes"))
        );
        colPredictions.addChild(
            WidgetFactory.text()
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
            const nameText = WidgetFactory.text()
                .setFontSize(fontSize)
                .setText(outcomeName);
            colName.addChild(nameText);

            const voteTotalText = WidgetFactory.text()
                .setFontSize(fontSize)
                .setText(" [0] ");

            const votePanel =
                WidgetFactory.horizontalBox().addChild(voteTotalText);
            const voteTexts = [];
            for (const playerDesk of world.TI4.getAllPlayerDesks()) {
                const voteText = WidgetFactory.text()
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
                const predictionText = WidgetFactory.text()
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

        const box = WidgetFactory.horizontalBox()
            .setChildDistance(CONFIG.spacing * 3)
            .addChild(colName)
            .addChild(colVotes)
            .addChild(colPredictions);
        rightPanel.addChild(box);

        rightPanel.addChild(
            WidgetFactory.border().setColor(CONFIG.spacerColor)
        );

        const playerName = "?";
        this._waitingFor = WidgetFactory.text()
            .setText(
                locale("ui.agenda.clippy.waiting_for_player_name", {
                    playerName,
                })
            )
            .setJustification(TextJustification.Center)
            .setFontSize(fontSize);

        rightPanel.addChild(this._waitingFor);

        const rightBox = WidgetFactory.layoutBox()
            .setChild(rightPanel)
            .setVerticalAlignment(VerticalAlignment.Center)
            .setHorizontalAlignment(HorizontalAlignment.Center);

        this.addChild(rightBox, 1);
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

            if (!outcome) {
                continue; // "can't happen" but got an error report
            }

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
