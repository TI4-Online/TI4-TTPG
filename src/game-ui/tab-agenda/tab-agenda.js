const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { AgendaStateMachine } = require("./agenda-state-machine");
const { AgendaTurnOrder } = require("./agenda-turn-order");
const { AgendaUiDeskWhenAfter } = require("./agenda-ui-desk-when-after");
const { AgendaUiMainAfter } = require("./agenda-ui-main-after");
const { AgendaUiMainBlank } = require("./agenda-ui-main-blank");
const { AgendaUiMainOutcomeType } = require("./agenda-ui-main-outcome-type");
const { AgendaUiMainStart } = require("./agenda-ui-main-start");
const { AgendaUiMainVote } = require("./agenda-ui-main-vote");
const { AgendaUiMainWhen } = require("./agenda-ui-main-when");
const { Broadcast } = require("../../lib/broadcast");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { LayoutBox, globalEvents, world } = require("../../wrapper/api");
const { AgendaUiDeskPredictVote } = require("./agenda-ui-desk-predict-vote");

class TabAgenda {
    static getStatusPad(playerDesk) {
        const playerSlot = playerDesk.playerSlot;
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid !== "pad:base/status") {
                continue;
            }
            if (obj.getOwningPlayerSlot() != playerSlot) {
                continue;
            }
            return obj;
        }
    }

    constructor(doRefresh) {
        assert(typeof doRefresh === "function");

        this._doRefresh = doRefresh;
        this._widget = new LayoutBox();
        this._stateMachine = undefined;

        this._outcomeType = undefined;
        this._outcomes = [];
        this._noWhensSet = new Set();
        this._noAftersSet = new Set();
        this._deskUIs = [];

        // Once-only event that resets early pass indicators and advances the state.
        this._advanceOnTurnOrderEmpty = () => {
            // Only trigger once.
            globalEvents.TI4.onTurnOrderEmpty.remove(
                this._advanceOnTurnOrderEmpty
            );
            // Wait until next frame to finish processing (let other listeners go first).
            // This makes sure status pads can reset to active before setting turn order.
            // (Not strictly needed, but feels safer.)
            process.nextTick(() => {
                if (this._stateMachine) {
                    this._stateMachine.next();
                }
                this.updateUI();
            });
        };

        globalEvents.TI4.onAgendaChanged.add((agendaCard) => {
            if (agendaCard) {
                this._stateMachine = new AgendaStateMachine();
            } else {
                this._stateMachine = undefined;
            }
            this._noWhensSet = new Set();
            this._noAftersSet = new Set();
            this._outcomeType = undefined;
            this._outcomes = [];
            this.updateUI();

            for (const playerDesk of world.TI4.getAllPlayerDesks()) {
                const statusPad = TabAgenda.getStatusPad(playerDesk);
                if (statusPad.__getPass()) {
                    statusPad.__setPass(false);
                }
            }
        });

        // Let players mark they will pass when it becomes their turn.
        // Wait until it is a player's turn to pass (do not reveal "no whens" before then).
        globalEvents.TI4.onTurnChanged.add(
            (currentDesk, previousDesk, clickingPlayer) => {
                if (!this._stateMachine) {
                    return;
                }
                const index = currentDesk.index;
                if (
                    (this._stateMachine.main === "WHEN.MAIN" &&
                        this._noWhensSet.has(index)) ||
                    (this._stateMachine.main === "AFTER.MAIN" &&
                        this._noAftersSet.has(index))
                ) {
                    const statusPad = TabAgenda.getStatusPad(currentDesk);
                    if (!statusPad.__getPass()) {
                        statusPad.__setPass(true);
                    }
                    world.TI4.turns.endTurn();
                }

                for (const deskUI of this._deskUIs) {
                    deskUI.update();
                }
            }
        );

        this.updateUI();
    }

    getUI() {
        return this._widget;
    }

    updateUI() {
        this.updateMainUI();
        this.updateDeskUI();
    }

    updateMainUI() {
        // Abort if not active.
        if (!this._stateMachine) {
            this._widget.setChild(new AgendaUiMainBlank());
            return;
        }

        const onNext = (button, player) => {
            this._stateMachine.next();
            this.updateUI();
        };
        const onCancel = (button, player) => {
            this._stateMachine = undefined;
            this.updateUI();
        };
        const onOutcomeType = (outcomeType) => {
            this._outcomeType = outcomeType;
            const doUpdateDesks = () => {
                this.updateDeskUI();
            };
            this._outcomes = AgendaUiMainOutcomeType.getDefaultOutcomes(
                outcomeType,
                doUpdateDesks
            );
            this._outcomes.forEach((outcome) => {
                outcome.setMutablePredictions();
                outcome.setMutableVotes();
            });
        };
        let order;

        switch (this._stateMachine.main) {
            case "START.MAIN":
                this._widget.setChild(
                    new AgendaUiMainStart().setNext(onNext).setCancel(onCancel)
                );
                break;
            case "OUTCOME_TYPE.MAIN":
                this._widget.setChild(
                    new AgendaUiMainOutcomeType()
                        .setNext(onNext)
                        .setOutcomeTypeListener(onOutcomeType)
                );
                break;
            case "WHEN.MAIN":
                this._widget.setChild(new AgendaUiMainWhen(this._doRefresh));
                order = AgendaTurnOrder.getResolveOrder();
                globalEvents.TI4.onTurnOrderEmpty.remove(
                    this._advanceOnTurnOrderEmpty
                );
                globalEvents.TI4.onTurnOrderEmpty.add(
                    this._advanceOnTurnOrderEmpty
                );
                world.TI4.turns.setTurnOrder(order);
                world.TI4.turns.setCurrentTurn(order[0], undefined);
                break;
            case "AFTER.MAIN":
                this._widget.setChild(new AgendaUiMainAfter(this._doRefresh));
                order = AgendaTurnOrder.getResolveOrder();
                globalEvents.TI4.onTurnOrderEmpty.remove(
                    this._advanceOnTurnOrderEmpty
                );
                globalEvents.TI4.onTurnOrderEmpty.add(
                    this._advanceOnTurnOrderEmpty
                );
                world.TI4.turns.setTurnOrder(order);
                world.TI4.turns.setCurrentTurn(order[0], undefined);
                break;
            case "VOTE.MAIN":
                this._widget.setChild(new AgendaUiMainVote(this._doRefresh));
                order = AgendaTurnOrder.getVoteOrder();
                globalEvents.TI4.onTurnOrderEmpty.remove(
                    this._advanceOnTurnOrderEmpty
                );
                globalEvents.TI4.onTurnOrderEmpty.add(
                    this._advanceOnTurnOrderEmpty
                );
                world.TI4.turns.setTurnOrder(order);
                world.TI4.turns.setCurrentTurn(order[0], undefined);
                break;
            default:
                throw new Error(`unknown state "${this._stateMachine.main}"`);
        }
    }

    updateDeskUI() {
        // Always clear, recreate if in use.
        for (const deskUI of this._deskUIs) {
            deskUI.detach();
        }
        this._deskUIs = [];

        // Abort if not active.
        if (!this._stateMachine) {
            this._widget.setChild(new AgendaUiMainBlank());
            return;
        }

        if (this._stateMachine.desk === "WHEN-AFTER.DESK") {
            const isWhen =
                this._stateMachine && this._stateMachine.main === "WHEN.MAIN";
            for (const playerDesk of world.TI4.getAllPlayerDesks()) {
                const deskWhenAfter = new AgendaUiDeskWhenAfter(
                    playerDesk,
                    isWhen
                ).attach();
                deskWhenAfter.anyWhens.setIsChecked(
                    !this._noWhensSet.has(playerDesk.index)
                );
                deskWhenAfter.anyWhens.onCheckStateChanged.add(
                    (checkBox, player, isChecked) => {
                        if (isChecked) {
                            this._noWhensSet.delete(playerDesk.index);
                        } else {
                            this._noWhensSet.add(playerDesk.index);
                        }
                        if (
                            world.TI4.turns.getCurrentTurn() === playerDesk &&
                            this._stateMachine &&
                            this._stateMachine.main === "WHEN.MAIN"
                        ) {
                            const statusPad =
                                TabAgenda.getStatusPad(playerDesk);
                            if (!statusPad.__getPass()) {
                                statusPad.__setPass(true);
                            }
                            world.TI4.turns.endTurn();
                        }
                    }
                );
                deskWhenAfter.anyAfters.setIsChecked(
                    !this._noAftersSet.has(playerDesk.index)
                );
                deskWhenAfter.anyAfters.onCheckStateChanged.add(
                    (checkBox, player, isChecked) => {
                        if (isChecked) {
                            this._noAftersSet.delete(playerDesk.index);
                        } else {
                            this._noAftersSet.add(playerDesk.index);
                        }
                        if (
                            world.TI4.turns.getCurrentTurn() === playerDesk &&
                            this._stateMachine &&
                            this._stateMachine.main === "AFTER.MAIN"
                        ) {
                            const statusPad =
                                TabAgenda.getStatusPad(playerDesk);
                            if (!statusPad.__getPass()) {
                                statusPad.__setPass(true);
                            }
                            world.TI4.turns.endTurn();
                        }
                    }
                );
                deskWhenAfter.playPredictOutcome.onClicked.add(
                    (button, player) => {
                        const msg =
                            "ui.agenda.clippy.playing_after_player_name";
                        const playerName = playerDesk.colorName;
                        Broadcast.chatAll(locale(msg, { playerName }));
                        // TODO XXX SHOW CHOOSE PREDICTION UI
                        if (world.TI4.turns.getCurrentTurn() === playerDesk) {
                            world.TI4.turns.endTurn();
                        }
                    }
                );
                deskWhenAfter.playOther.onClicked.add((button, player) => {
                    const msg = isWhen
                        ? "ui.agenda.clippy.playing_when_player_name"
                        : "ui.agenda.clippy.playing_after_player_name";
                    const playerName = playerDesk.colorName;
                    Broadcast.chatAll(locale(msg, { playerName }));
                    if (world.TI4.turns.getCurrentTurn() === playerDesk) {
                        world.TI4.turns.endTurn();
                    }
                });
                this._deskUIs.push(deskWhenAfter);
            }
        } else if (this._stateMachine.desk === "VOTE.DESK") {
            for (const playerDesk of world.TI4.getAllPlayerDesks()) {
                const deskVote = new AgendaUiDeskPredictVote(
                    playerDesk,
                    this._outcomes
                ).attach();
                this._deskUIs.push(deskVote);
            }
        }
    }
}

module.exports = { TabAgenda };
