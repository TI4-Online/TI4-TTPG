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
    Text,
    TextJustification,
    VerticalAlignment,
    globalEvents,
    refPackageId,
    world,
} = require("../../wrapper/api");

// Keep private text widgets for editing.
const _outcomeIndexToDeskIndexToVoteText = {};

globalEvents.TI4.onAgendaPlayerStateChanged.add(() => {
    AgendaUiMain._updateVoteAndPredictionText();
});

class AgendaUiMain {
    static _getVoteText(outcomeIndex, deskIndex) {
        assert(typeof outcomeIndex === "number");
        assert(typeof deskIndex === "number");
        let deskIndexToVoteText =
            _outcomeIndexToDeskIndexToVoteText[outcomeIndex];
        if (!deskIndexToVoteText) {
            deskIndexToVoteText = {};
            _outcomeIndexToDeskIndexToVoteText[outcomeIndex] =
                deskIndexToVoteText;
        }
        let voteText = deskIndexToVoteText[deskIndex];
        if (!voteText) {
            voteText = new Text();
            deskIndexToVoteText[deskIndex] = voteText;
        }
        return voteText;
    }

    static _getPredictionText(outcomeIndex, deskIndex) {
        return AgendaUiMain._getVoteText(outcomeIndex, deskIndex + 100);
    }

    static _updateVoteAndPredictionText() {
        const agenda = world.TI4.agenda;

        for (
            let outcomeIndex = 0;
            outcomeIndex < agenda.getNumOutcomes();
            outcomeIndex++
        ) {
            let deskIndex = -2; // for outcome name
            AgendaUiMain._getVoteText(outcomeIndex, deskIndex).setText(
                agenda.getOutcomeName(outcomeIndex)
            );

            let total = 0;
            const peerCount = world.TI4.config.playerCount;
            for (let peerIndex = 0; peerIndex < peerCount; peerIndex++) {
                const text = AgendaUiMain._getVoteText(outcomeIndex, peerIndex);
                const peerOutcomeIndex = agenda.getVoteOutcomeIndex(peerIndex);
                if (peerOutcomeIndex === outcomeIndex) {
                    const votes = agenda.getVoteCount(peerIndex);
                    if (votes > 0) {
                        total += votes;
                    }
                    text.setText(`${votes} `);
                } else {
                    text.setText("");
                }
            }
            deskIndex = -1; // vote total
            AgendaUiMain._getVoteText(outcomeIndex, deskIndex).setText(
                `[${total}] `
            );

            for (let peerIndex = 0; peerIndex < peerCount; peerIndex++) {
                const text = AgendaUiMain._getPredictionText(
                    outcomeIndex,
                    peerIndex
                );
                const predictions = agenda.getPredictionCount(
                    peerIndex,
                    outcomeIndex
                );
                if (predictions > 0) {
                    text.setText(new Array(predictions + 1).join("X"));
                } else {
                    text.setText("");
                }
            }
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

        const label = WidgetFactory.text()
            .setJustification(TextJustification.Center)
            .setFontSize(CONFIG.fontSize)
            .setAutoWrap(true)
            .setText(locale("ui.agenda.clippy.would_you_like_help"));

        const yesButton = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.agenda.clippy.yes"));
        yesButton.onClicked.add(
            ThrottleClickHandler.wrap(onClickHandlers.yesHelp)
        );

        const noButton = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.agenda.clippy.no"));
        noButton.onClicked.add(
            ThrottleClickHandler.wrap(onClickHandlers.noHelp)
        );

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

        const label = WidgetFactory.text()
            .setJustification(TextJustification.Center)
            .setFontSize(CONFIG.fontSize)
            .setAutoWrap(true)
            .setText(locale("ui.agenda.clippy.outcome_category"));

        const forAgainstButton = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.agenda.outcome_type.for_against"));
        forAgainstButton.onClicked.add(
            ThrottleClickHandler.wrap(onClickHandlers.forAgainst)
        );

        const electPlayerButton = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.agenda.outcome_type.player"));
        electPlayerButton.onClicked.add(
            ThrottleClickHandler.wrap(onClickHandlers.electPlayer)
        );

        const electStrategyCardButton = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.agenda.outcome_type.strategy_card"));
        electStrategyCardButton.onClicked.add(
            ThrottleClickHandler.wrap(onClickHandlers.electStrategyCard)
        );

        const electOtherButton = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.agenda.outcome_type.other"));
        electOtherButton.onClicked.add(
            ThrottleClickHandler.wrap(onClickHandlers.electOther)
        );

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
            let deskIndex = -2; // for outcome name
            const outcomeName = AgendaUiMain._getVoteText(
                outcomeIndex,
                deskIndex
            ).setFontSize(fontSize);
            colName.addChild(outcomeName);

            deskIndex = -1; // vote total
            const voteTotal = AgendaUiMain._getVoteText(
                outcomeIndex,
                deskIndex
            ).setFontSize(fontSize);

            const votePanel = WidgetFactory.horizontalBox()
                .setChildDistance(0)
                .addChild(voteTotal);
            colVotes.addChild(votePanel);

            const predictionPanel =
                WidgetFactory.horizontalBox().setChildDistance(0);
            colPredictions.addChild(predictionPanel);

            for (const playerDesk of world.TI4.getAllPlayerDesks()) {
                const deskIndex = playerDesk.index;
                const vote = AgendaUiMain._getVoteText(outcomeIndex, deskIndex)
                    .setFontSize(fontSize)
                    .setTextColor(playerDesk.color);
                votePanel.addChild(vote);

                const predictionText = AgendaUiMain._getPredictionText(
                    outcomeIndex,
                    deskIndex
                )
                    .setFontSize(fontSize)
                    .setTextColor(playerDesk.color);
                predictionPanel.addChild(predictionText);
            }
        }

        const resetAvailableVotesButton = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.agenda.clippy.reset_available_votes"));
        resetAvailableVotesButton.onClicked.add(
            ThrottleClickHandler.wrap(onClickHandlers.resetAvailableVotes)
        );

        const panel = WidgetFactory.verticalBox()
            .setChildDistance(CONFIG.spacing)
            .setVerticalAlignment(VerticalAlignment.Center)
            .addChild(availableVotesPanel, 0)
            .addChild(agendaCardAndAgendaStateBox, 1)
            .addChild(resetAvailableVotesButton, 0);

        WidgetFactory.setChild(this._widget, panel);

        AgendaUiMain._updateVoteAndPredictionText();
    }

    setOutcome(onClickHandlers, outcomeSummary) {
        assert(typeof onClickHandlers === "object");
        assert(typeof onClickHandlers.resetCards === "function");
        assert(typeof outcomeSummary === "string");

        assert(typeof onClickHandlers.resetCards === "function");

        const label = WidgetFactory.text()
            .setJustification(TextJustification.Center)
            .setFontSize(CONFIG.fontSize)
            .setAutoWrap(true)
            .setText(locale("ui.agenda.clippy.outcome"));

        const outcome = WidgetFactory.text()
            .setJustification(TextJustification.Center)
            .setFontSize(CONFIG.fontSize)
            .setAutoWrap(true)
            .setText(outcomeSummary);

        const resetCardsButton = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.agenda.clippy.reset_cards"));
        resetCardsButton.onClicked.add(
            ThrottleClickHandler.wrap(onClickHandlers.resetCards)
        );

        const panel = WidgetFactory.verticalBox()
            .setChildDistance(CONFIG.spacing)
            .setVerticalAlignment(VerticalAlignment.Center)
            .addChild(label)
            .addChild(outcome)
            .addChild(resetCardsButton);

        WidgetFactory.setChild(this._widget, panel);
    }
}

module.exports = { AgendaUiMain };
