const locale = require("../../lib/locale");
const { Agenda } = require("../../lib/agenda/agenda");
const { AgendaUiDesk } = require("./agenda-ui-desk");
const { AgendaUiMain } = require("./agenda-ui-main");
const { Broadcast } = require("../../lib/broadcast");
const { OUTCOME_TYPE } = require("../../lib/agenda/agenda-outcome");
const { LayoutBox, globalEvents, world } = require("../../wrapper/api");
const { ThrottleClickHandler } = require("../../lib/ui/throttle-click-handler");

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

class TabAgenda {
    constructor() {
        this._widget = new LayoutBox();

        // If the overall state changes for main/desks destroy and recreate.
        // This causes a screen flash, so minor updates just edit UI in place.
        this._stateMain = undefined;
        this._stateDesk = undefined;

        this._deskUIs = undefined;

        // When using the world.TI4.agenda to update state all changes
        // generate this event.  No need to listen for turn events.
        globalEvents.TI4.onAgendaPlayerStateChanged.add(() => {
            this.update();
        });

        // Update manually to seed initial state.
        this.update();
    }

    getUI() {
        return this._widget;
    }

    update() {
        this._maybeReplaceMain();
        this._updateMain();
        this._maybeReplaceDesks();
        this._updateDesks();
    }

    _maybeReplaceMain() {
        const agenda = world.TI4.agenda;
        const stateMachine = agenda.getStateMachine();
        const stateMain = stateMachine && stateMachine.main;

        if (stateMain && stateMain === this._stateMain) {
            return; // already in state
        }
        this._stateMain = stateMain;

        const onResetPlanetCards = () => {
            Agenda.resetPlanetCards();
        };
        const onStart = ThrottleClickHandler.wrap((button, player) => {
            agenda.start();
        });
        const onCancel = ThrottleClickHandler.wrap((button, player) => {
            agenda.clear();
        });
        const outcomeButtonTextsAndOnClicks = [
            {
                text: locale("ui.agenda.outcome_type.for_against"),
                onClick: ThrottleClickHandler.wrap((button, player) => {
                    agenda.resetOutcomeNames(OUTCOME_TYPE.FOR_AGAINST);
                }),
            },
            {
                text: locale("ui.agenda.outcome_type.player"),
                onClick: ThrottleClickHandler.wrap((button, player) => {
                    agenda.resetOutcomeNames(OUTCOME_TYPE.PLAYER);
                }),
            },
            {
                text: locale("ui.agenda.outcome_type.strategy_card"),
                onClick: ThrottleClickHandler.wrap((button, player) => {
                    agenda.resetOutcomeNames(OUTCOME_TYPE.STRATEGY_CARD);
                }),
            },
            {
                text: locale("ui.agenda.outcome_type.other"),
                onClick: ThrottleClickHandler.wrap((button, player) => {
                    agenda.resetOutcomeNames(OUTCOME_TYPE.OTHER);
                }),
            },
        ];

        // Abort if not active.
        if (!agenda.isActive()) {
            this._widget.setChild(
                AgendaUiMain.simpleButton(
                    locale("ui.agenda.clippy.place_agenda_to_start"),
                    locale("ui.agenda.clippy.reset_cards"),
                    onResetPlanetCards
                )
            );
            return;
        }

        let summary;
        switch (stateMain) {
            case "WAITING_FOR_START.MAIN":
                this._widget.setChild(
                    AgendaUiMain.simpleYesNo(
                        locale("ui.agenda.clippy.would_you_like_help"),
                        onStart,
                        onCancel
                    )
                );
                break;
            case "OUTCOME_TYPE.MAIN":
                this._widget.setChild(
                    AgendaUiMain.simpleButtonList(
                        locale("ui.agenda.clippy.outcome_category"),
                        outcomeButtonTextsAndOnClicks
                    )
                );
                break;
            case "WHEN.MAIN":
                this._widget.setChild(
                    AgendaUiMain.simpleWithState(
                        locale("ui.agenda.clippy.whens")
                    )
                );
                break;
            case "AFTER.MAIN":
                this._widget.setChild(
                    AgendaUiMain.simpleWithState(
                        locale("ui.agenda.clippy.afters")
                    )
                );
                break;
            case "VOTE.MAIN":
                this._widget.setChild(
                    AgendaUiMain.simpleWithState(
                        locale("ui.agenda.clippy.voting")
                    )
                );
                break;
            case "POST.MAIN":
                this._widget.setChild(
                    AgendaUiMain.simple(locale("ui.agenda.clippy.post"))
                );
                break;
            case "FINISH.MAIN":
                summary = locale("ui.agenda.clippy.outcome", {
                    outcome: agenda.summarizeVotes(),
                    riders: agenda.summarizePredictions(),
                });
                this._widget.setChild(
                    AgendaUiMain.simpleButton(
                        summary,
                        locale("ui.agenda.clippy.reset_cards"),
                        onResetPlanetCards
                    )
                );
                Broadcast.chatAll(summary);
                break;
            default:
                throw new Error(`unknown state "${stateMain}"`);
        }
    }

    _updateMain() {
        // Placeholder, nop for now.
    }

    _maybeReplaceDesks() {
        const agenda = world.TI4.agenda;
        const stateMachine = agenda.getStateMachine();
        const stateDesk = stateMachine && stateMachine.desk;

        // If no desk state, remove any desk UIs.
        if (!stateDesk) {
            if (this._deskUIs) {
                for (const deskUI of this._deskUIs) {
                    deskUI.detach();
                }
            }
            this._deskUIs = undefined;
            this._stateDesk = undefined;
            return;
        }

        // Abort if already in state, otherwise mark self as in new state.
        if (stateDesk === this._stateDesk) {
            return; // already in state
        }
        this._stateDesk = stateDesk;

        const callbacks = {
            onNoWhens: (playerDesk, clickingPlayer) => {
                agenda.setNoWhens(playerDesk.index, true, clickingPlayer);
            },
            onPlayWhen: (playerDesk, clickingPlayer) => {
                const playerName = capitalizeFirstLetter(playerDesk.colorName);
                Broadcast.chatAll(
                    locale("ui.agenda.clippy.playing_when_player_name", {
                        playerName,
                    })
                );
                agenda.playWhen(playerDesk.index, clickingPlayer);
            },
            onNoAfters: (playerDesk, clickingPlayer) => {
                agenda.setNoAfters(playerDesk.index, true, clickingPlayer);
            },
            onPlayAfter: (playerDesk, clickingPlayer) => {
                const playerName = capitalizeFirstLetter(playerDesk.colorName);
                Broadcast.chatAll(
                    locale("ui.agenda.clippy.playing_after_player_name", {
                        playerName,
                    })
                );
                agenda.playAfter(playerDesk.index, clickingPlayer);
            },
            onOutcomeEdit: (outcomeIndex, outcomeName) => {
                agenda.setOutcomeName(outcomeIndex, outcomeName);
            },
            onVoteOutcome: (playerDesk, outcomeIndex, clickingPlayer) => {
                agenda.setVoteOutcomeIndex(
                    playerDesk.index,
                    outcomeIndex,
                    clickingPlayer
                );
            },
            onVoteIncr: (playerDesk, clickingPlayer) => {
                let votes = agenda.getVoteCount(playerDesk.index);
                votes = Math.min(500, votes + 1);
                agenda.setVoteCount(playerDesk.index, votes, clickingPlayer);
            },
            onVoteDecr: (playerDesk, clickingPlayer) => {
                let votes = agenda.getVoteCount(playerDesk.index);
                votes = Math.max(0, votes - 1);
                agenda.setVoteCount(playerDesk.index, votes, clickingPlayer);
            },
            onVoteLocked: (playerDesk, clickingPlayer) => {
                let isLocked = agenda.getVoteLocked(playerDesk.index);
                isLocked = !isLocked;
                agenda.setVoteLocked(
                    playerDesk.index,
                    isLocked,
                    clickingPlayer
                );
            },
            onPredictIncr: (playerDesk, outcomeIndex, clickingPlayer) => {
                let count = agenda.getPredictionCount(
                    playerDesk.index,
                    outcomeIndex
                );
                count = Math.min(10, count + 1);
                agenda.setPredictionCount(
                    playerDesk.index,
                    outcomeIndex,
                    count,
                    clickingPlayer
                );
            },
            onPredictDecr: (playerDesk, outcomeIndex, clickingPlayer) => {
                let count = agenda.getPredictionCount(
                    playerDesk.index,
                    outcomeIndex
                );
                count = Math.max(0, count - 1);
                agenda.setPredictionCount(
                    playerDesk.index,
                    outcomeIndex,
                    count,
                    clickingPlayer
                );
            },
        };

        // Otherwise need desk UI.
        this._deskUIs = [];
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            const outcomeNamesMutable = agenda.getOutcomeName(0) === "?";
            const deskUi = new AgendaUiDesk(
                playerDesk,
                outcomeNamesMutable,
                callbacks
            );
            deskUi.attach();
            this._deskUIs.push(deskUi);
        }
    }

    _updateDesks() {
        if (!this._deskUIs) {
            return;
        }
        for (const deskUI of this._deskUIs) {
            deskUI.update();
        }
    }
}

module.exports = { TabAgenda };
