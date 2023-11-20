const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const CONFIG = require("../game-ui-config");
const {
    AgendaWidgetAvailableVotes,
} = require("./agenda-widget-available-votes");
const { AgendaCardWidget } = require("../../lib/agenda/agenda-card-widget");
const { ThrottleClickHandler } = require("../../lib/ui/throttle-click-handler");
const { WidgetFactory } = require("../../lib/ui/widget-factory");
const {
    HorizontalAlignment,
    TextJustification,
    VerticalAlignment,
    globalEvents,
    refPackageId,
    world,
} = require("../../wrapper/api");

// Keep private text widgets for editing.
const _outcomeIndexToWidgets = {};

let _waitingFor = undefined;

function updateWaitingFor() {
    if (_waitingFor) {
        const stateMachine = world.TI4.agenda.getStateMachine();
        const state = stateMachine && stateMachine.name;
        let msg = "ui.agenda.clippy.waiting_for_player_name"; // generic
        if (state === "WHEN") {
            msg = "ui.agenda.clippy.waiting_whens";
        } else if (state === "AFTER") {
            msg = "ui.agenda.clippy.waiting_afters";
        } else if (state === "VOTE") {
            msg = "ui.agenda.clippy.waiting_vote";
        }
        const currentDesk = world.TI4.turns.getCurrentTurn();
        const playerName = currentDesk.colorName;
        _waitingFor.setText(
            locale(msg, {
                playerName,
            })
        );
    }
}

globalEvents.TI4.onAgendaPlayerStateChanged.add(() => {
    AgendaUiMain._updateVoteAndPredictionText();
    updateWaitingFor();
});

class AgendaUiMain {
    static _getWidgets(outcomeIndex, alloc) {
        assert(typeof outcomeIndex === "number");
        assert(typeof alloc === "boolean");

        let result = _outcomeIndexToWidgets[outcomeIndex];
        if (!result) {
            const outcomeName = WidgetFactory.text();
            const votesText = WidgetFactory.richText();
            const predictionsText = WidgetFactory.richText();
            result = {
                outcomeName,
                votesText,
                predictionsText,
            };
            _outcomeIndexToWidgets[outcomeIndex] = result;
        }

        if (alloc) {
            let parent = result.outcomeName.getParent();
            if (parent) {
                parent.removeAllChildren();
            }
            parent = result.votesText.getParent();
            if (parent) {
                parent.removeAllChildren();
            }
            parent = result.predictionsText.getParent();
            if (parent) {
                parent.removeAllChildren();
            }
        }

        return result;
    }

    static _updateVoteAndPredictionText() {
        const agenda = world.TI4.agenda;
        const deskIndexToColor = world.TI4.getAllPlayerDesks().map(
            (playerDesk) => {
                return playerDesk.widgetColor
                    .toHex()
                    .substring(0, 6)
                    .toLowerCase();
            }
        );

        for (
            let outcomeIndex = 0;
            outcomeIndex < agenda.getNumOutcomes();
            outcomeIndex++
        ) {
            const { outcomeName, votesText, predictionsText } =
                AgendaUiMain._getWidgets(outcomeIndex, false);

            outcomeName.setText(agenda.getOutcomeName(outcomeIndex));

            let voteTexts = [];
            let total = 0;
            const peerCount = world.TI4.config.playerCount;
            for (let peerIndex = 0; peerIndex < peerCount; peerIndex++) {
                const peerOutcomeIndex = agenda.getVoteOutcomeIndex(peerIndex);
                if (peerOutcomeIndex === outcomeIndex) {
                    const votes = agenda.getVoteCount(peerIndex);
                    if (votes > 0) {
                        total += votes;
                        const color = deskIndexToColor[peerIndex];
                        voteTexts.push(`[color=#${color}]${votes}[/color]`);
                    }
                }
            }
            let msg = ` [${total}] ${voteTexts.join(" ")}`;
            votesText.setText(msg);

            let predictionsTexts = [];
            for (let peerIndex = 0; peerIndex < peerCount; peerIndex++) {
                const predictions = agenda.getPredictionCount(
                    peerIndex,
                    outcomeIndex
                );
                if (predictions > 0) {
                    msg = new Array(predictions + 1).join("X");
                    const color = deskIndexToColor[peerIndex];
                    predictionsTexts.push(`[color=#${color}]${msg}[/color]`);
                }
            }
            msg = predictionsTexts.join("");
            predictionsText.setText(msg);
        }
    }

    constructor() {
        this._widget = WidgetFactory.layoutBox();
    }

    getWidget() {
        return this._widget;
    }

    setPlaceAgendaToStart(onClickHandlers) {
        assert(typeof onClickHandlers === "object");
        assert(typeof onClickHandlers.resetCards === "function");

        const label = WidgetFactory.text()
            .setJustification(TextJustification.Center)
            .setFontSize(CONFIG.fontSize)
            .setAutoWrap(true)
            .setText(locale("ui.agenda.clippy.place_agenda_to_start"));

        const resetCardsButton = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.agenda.clippy.reset_cards"));
        resetCardsButton.onClicked.add(
            ThrottleClickHandler.wrap(onClickHandlers.resetCards)
        );

        const empty = WidgetFactory.layoutBox();

        const panel = WidgetFactory.verticalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(label, 0)
            .addChild(empty, 1)
            .addChild(resetCardsButton, 0);

        WidgetFactory.setChild(this._widget, panel);
    }

    setWouldYouLikeHelp(onClickHandlers) {
        assert(typeof onClickHandlers === "object");
        assert(typeof onClickHandlers.yesHelp === "function");
        assert(typeof onClickHandlers.noHelp === "function");

        const onlyOne = ThrottleClickHandler.onlyOne({
            yesHelp: onClickHandlers.yesHelp,
            noHelp: onClickHandlers.noHelp,
        });
        const label = WidgetFactory.text()
            .setJustification(TextJustification.Center)
            .setFontSize(CONFIG.fontSize)
            .setAutoWrap(true)
            .setText(locale("ui.agenda.clippy.would_you_like_help"));

        const yesButton = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.agenda.clippy.yes"));
        yesButton.onClicked.add(onlyOne.yesHelp);

        const noButton = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.agenda.clippy.no"));
        noButton.onClicked.add(onlyOne.noHelp);

        const leftPanel = WidgetFactory.verticalBox()
            .setChildDistance(CONFIG.spacing)
            .setVerticalAlignment(VerticalAlignment.Center)
            .addChild(label)
            .addChild(yesButton)
            .addChild(noButton);

        const leftBox = WidgetFactory.layoutBox()
            .setVerticalAlignment(VerticalAlignment.Center)
            .setChild(leftPanel);

        const img = WidgetFactory.imageWidget()
            .setImage("global/ui/mechy.png", refPackageId)
            .setImageSize(256 * CONFIG.scale, 256 * CONFIG.scale);
        const rightPanel = WidgetFactory.layoutBox()
            .setVerticalAlignment(VerticalAlignment.Center)
            .setHorizontalAlignment(HorizontalAlignment.Center)
            .setChild(img);

        const panel = WidgetFactory.horizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(leftBox, 1)
            .addChild(rightPanel, 0);

        WidgetFactory.setChild(this._widget, panel);
    }

    setChooseOutcomeType(onClickHandlers) {
        assert(typeof onClickHandlers === "object");
        assert(typeof onClickHandlers.forAgainst === "function");
        assert(typeof onClickHandlers.electPlayer === "function");
        assert(typeof onClickHandlers.electStrategyCard === "function");
        assert(typeof onClickHandlers.electOther === "function");

        // There's a window between one player clicking and actually
        // moving to the next UI.  Reject any extra clicks that happen.
        const onlyOne = ThrottleClickHandler.onlyOne({
            forAgainst: onClickHandlers.forAgainst,
            electPlayer: onClickHandlers.electPlayer,
            electStrategyCard: onClickHandlers.electStrategyCard,
            electOther: onClickHandlers.electOther,
        });

        const label = WidgetFactory.text()
            .setJustification(TextJustification.Center)
            .setFontSize(CONFIG.fontSize)
            .setAutoWrap(true)
            .setText(locale("ui.agenda.clippy.outcome_category"));

        const forAgainstButton = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.agenda.outcome_type.for_against"));
        forAgainstButton.onClicked.add(onlyOne.forAgainst);

        const electPlayerButton = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.agenda.outcome_type.player"));
        electPlayerButton.onClicked.add(onlyOne.electPlayer);

        const electStrategyCardButton = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.agenda.outcome_type.strategy_card"));
        electStrategyCardButton.onClicked.add(onlyOne.electStrategyCard);

        const electOtherButton = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.agenda.outcome_type.other"));
        electOtherButton.onClicked.add(onlyOne.electOther);

        const leftPanel = WidgetFactory.verticalBox()
            .setChildDistance(CONFIG.spacing)
            .setVerticalAlignment(VerticalAlignment.Center)
            .addChild(label)
            .addChild(forAgainstButton)
            .addChild(electPlayerButton)
            .addChild(electStrategyCardButton)
            .addChild(electOtherButton);

        const leftBox = WidgetFactory.layoutBox()
            .setVerticalAlignment(VerticalAlignment.Center)
            .setChild(leftPanel);

        const img = WidgetFactory.imageWidget()
            .setImage("global/ui/mechy.png", refPackageId)
            .setImageSize(256 * CONFIG.scale, 256 * CONFIG.scale);
        const rightPanel = WidgetFactory.layoutBox()
            .setVerticalAlignment(VerticalAlignment.Center)
            .setHorizontalAlignment(HorizontalAlignment.Center)
            .setChild(img);

        const panel = WidgetFactory.horizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(leftBox, 1)
            .addChild(rightPanel, 0);

        WidgetFactory.setChild(this._widget, panel);
    }

    setActiveAgendaPhase(onClickHandlers) {
        assert(typeof onClickHandlers === "object");
        assert(typeof onClickHandlers.resetAvailableVotes === "function");

        // Release current UI so widgets can be reused (available votes text).
        WidgetFactory.setChild(this._widget, undefined);

        const agenda = world.TI4.agenda;
        let fontSize = CONFIG.fontSize;
        const fitOutcomes = 5;
        if (agenda.getNumOutcomes() > fitOutcomes) {
            fontSize = (fontSize * fitOutcomes) / agenda.getNumOutcomes();
        }

        const deskIndex = -1;
        const availableVotesPanel = new AgendaWidgetAvailableVotes(
            fontSize,
            deskIndex
        ).getWidget();

        const agendaCardAndAgendaStatePanel =
            WidgetFactory.horizontalBox().setChildDistance(CONFIG.spacing * 3);
        const agendaCardAndAgendaStateBox = WidgetFactory.layoutBox()
            .setVerticalAlignment(VerticalAlignment.Center)
            .setChild(agendaCardAndAgendaStatePanel);

        const card = world.TI4.agenda.getAgendaCard();
        if (card) {
            const leftPanel = AgendaCardWidget.getImageWidget(card);
            const width = 200 * CONFIG.scale;
            leftPanel.setImageSize(width, (width * 750) / 500);
            const leftBox = WidgetFactory.layoutBox()
                .setChild(leftPanel)
                .setVerticalAlignment(VerticalAlignment.Center)
                .setHorizontalAlignment(HorizontalAlignment.Center);
            agendaCardAndAgendaStatePanel.addChild(leftBox, 0);
        }

        const colName = WidgetFactory.verticalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(
                WidgetFactory.text()
                    .setFontSize(fontSize)
                    .setBold(true)
                    .setText(locale("ui.agenda.label.outcomes"))
            );
        const colVotes = WidgetFactory.verticalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(
                WidgetFactory.text()
                    .setFontSize(fontSize)
                    .setBold(true)
                    .setText(locale("ui.agenda.label.votes"))
            );
        const colPredictions = WidgetFactory.verticalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(
                WidgetFactory.text()
                    .setFontSize(fontSize)
                    .setBold(true)
                    .setText(locale("ui.agenda.label.predictions"))
            );
        agendaCardAndAgendaStatePanel
            .addChild(colName)
            .addChild(colVotes)
            .addChild(colPredictions);
        for (
            let outcomeIndex = 0;
            outcomeIndex < agenda.getNumOutcomes();
            outcomeIndex++
        ) {
            const { outcomeName, votesText, predictionsText } =
                AgendaUiMain._getWidgets(outcomeIndex, true);

            outcomeName.setFontSize(fontSize);
            colName.addChild(outcomeName);

            votesText.setFontSize(fontSize);
            colVotes.addChild(votesText);

            predictionsText.setFontSize(fontSize);
            colPredictions.addChild(predictionsText);
        }

        const resetAvailableVotesButton = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.agenda.clippy.reset_available_votes"));
        resetAvailableVotesButton.onClicked.add(
            ThrottleClickHandler.wrap(onClickHandlers.resetAvailableVotes)
        );

        _waitingFor = WidgetFactory.text()
            .setFontSize(CONFIG.fontSize)
            .setJustification(TextJustification.Center)
            .setText("-");
        updateWaitingFor();

        const panel = WidgetFactory.verticalBox()
            .setChildDistance(CONFIG.spacing)
            .setVerticalAlignment(VerticalAlignment.Center)
            .addChild(availableVotesPanel, 0)
            .addChild(agendaCardAndAgendaStateBox, 1)
            .addChild(_waitingFor, 0)
            .addChild(resetAvailableVotesButton, 0);

        WidgetFactory.setChild(this._widget, panel);

        AgendaUiMain._updateVoteAndPredictionText();
    }

    setOutcome(onClickHandlers, outcomeSummary) {
        assert(typeof onClickHandlers === "object");
        assert(typeof onClickHandlers.resetCards === "function");
        assert(typeof outcomeSummary === "string");

        assert(typeof onClickHandlers.resetCards === "function");

        const outcome = WidgetFactory.text()
            .setJustification(TextJustification.Center)
            .setFontSize(CONFIG.fontSize)
            .setAutoWrap(true)
            .setText(outcomeSummary);

        const outcomeBox = WidgetFactory.layoutBox()
            .setVerticalAlignment(VerticalAlignment.Center)
            .setChild(outcome);

        const resetCardsButton = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.agenda.clippy.reset_cards"));
        resetCardsButton.onClicked.add(
            ThrottleClickHandler.wrap(onClickHandlers.resetCards)
        );

        const panel = WidgetFactory.verticalBox()
            .setChildDistance(CONFIG.spacing)
            .setVerticalAlignment(VerticalAlignment.Center)
            .addChild(outcomeBox, 1)
            .addChild(resetCardsButton, 0);

        WidgetFactory.setChild(this._widget, panel);
    }
}

module.exports = { AgendaUiMain };
