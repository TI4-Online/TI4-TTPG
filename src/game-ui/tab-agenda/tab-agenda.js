const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { AgendaOutcome, OUTCOME_TYPE } = require("./agenda-outcome");
const { AgendaStateMachine } = require("./agenda-state-machine");
const { AgendaTurnOrder } = require("./agenda-turn-order");
const { AgendaUiDeskPredictVote } = require("./agenda-ui-desk-predict-vote");
const { AgendaUiDeskWhenAfter } = require("./agenda-ui-desk-when-after");
const { AgendaUiMain } = require("./agenda-ui-main");
const { Broadcast } = require("../../lib/broadcast");
const { CardUtil } = require("../../lib/card/card-util");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { Card, LayoutBox, globalEvents, world } = require("../../wrapper/api");

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

    constructor() {
        this._widget = new LayoutBox();
        this._stateMachine = undefined;

        this._outcomeType = undefined;
        this._outcomes = [];
        this._noWhensSet = new Set();
        this._noAftersSet = new Set();
        this._deskUIs = [];
        this._deskIndexToAvailableVotes = {};

        this._replaceWhenWithPredict = false;

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
            this._outcomeType = undefined;
            this._outcomes = [];
            this._noWhensSet = new Set();
            this._noAftersSet = new Set();
            this._deskIndexToAvailableVotes = {};
            this._replaceWhenWithPredict = false;
            this.refreshAvailableVotes();
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

                this.updateDeskUI();
            }
        );

        globalEvents.TI4.onPlanetCardFlipped.add((card, isFaceUp) => {
            assert(card instanceof Card);
            assert(typeof isFaceUp === "boolean");
            const pos = card.getPosition();
            const closestDesk = world.TI4.getClosestPlayerDesk(pos);
            const deskIndex = closestDesk.index;

            let chosenOutcome = false;
            for (const outcome of this._outcomes) {
                if (outcome._deskIndexVoting.has(deskIndex)) {
                    chosenOutcome = outcome;
                    break;
                }
            }
            if (!chosenOutcome) {
                return;
            }

            const planet = world.TI4.getPlanetByCard(card);
            assert(planet);
            let influence = planet.raw.influence;

            const deskIndexToPerPlanetBonus =
                this.getDeskIndexToPerPlanetBonus();
            const bonus = deskIndexToPerPlanetBonus[deskIndex] || 0;
            influence += bonus;

            const deltaValue = influence * (isFaceUp ? -1 : 1);
            const oldValue =
                chosenOutcome._deskIndexToVoteCount[deskIndex] || 0;
            const newValue = Math.max(0, oldValue + deltaValue);
            chosenOutcome._deskIndexToVoteCount[deskIndex] = newValue;
            chosenOutcome._updateVoteCounts();
        });

        this.updateUI();
    }

    getUI() {
        return this._widget;
    }

    getDeskIndexToPerPlanetBonus() {
        const result = {};

        let xxchaCommanderIndex = -1;
        let xxchaAllianceIndex = -1;

        const checkIsDiscardPile = false;
        const allowFaceDown = false;
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            if (!CardUtil.isLooseCard(obj, checkIsDiscardPile, allowFaceDown)) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid === "card.leader.commander.xxcha:pok/elder_qanoj") {
                const pos = obj.getPosition();
                const closestDesk = world.TI4.getClosestPlayerDesk(pos);
                xxchaCommanderIndex = closestDesk.index;
            } else if (nsid === "card.alliance:base/xxcha") {
                const pos = obj.getPosition();
                const closestDesk = world.TI4.getClosestPlayerDesk(pos);
                xxchaAllianceIndex = closestDesk.index;
            }
        }

        if (xxchaCommanderIndex >= 0) {
            result[xxchaCommanderIndex] = 1;

            // Alliance only applies if commander is unlocked.
            if (
                xxchaAllianceIndex >= 0 &&
                xxchaAllianceIndex != xxchaCommanderIndex
            ) {
                result[xxchaAllianceIndex] = 1;
            }
        }
        return result;
    }

    refreshAvailableVotes() {
        const deskIndexToPerPlanetBonus = this.getDeskIndexToPerPlanetBonus();

        this._deskIndexToAvailableVotes = {};
        const checkIsDiscardPile = false;
        const allowFaceDown = false;
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            if (!CardUtil.isLooseCard(obj, checkIsDiscardPile, allowFaceDown)) {
                continue;
            }
            const planet = world.TI4.getPlanetByCard(obj);
            if (!planet) {
                continue;
            }

            const pos = obj.getPosition();
            const closestDesk = world.TI4.getClosestPlayerDesk(pos);
            if (!closestDesk) {
                continue;
            }

            const deskIndex = closestDesk.index;
            const oldValue = this._deskIndexToAvailableVotes[deskIndex] || 0;
            let newValue = oldValue + planet.raw.influence;

            const bonus = deskIndexToPerPlanetBonus[deskIndex] || 0;
            newValue += bonus;

            this._deskIndexToAvailableVotes[deskIndex] = newValue;
        }
    }

    updateUI() {
        this.updateMainUI();
        this.updateDeskUI();
    }

    updateMainUI() {
        // Abort if not active.
        if (!this._stateMachine) {
            this._widget.setChild(
                AgendaUiMain.simpleNoMechy(
                    locale("ui.agenda.clippy.place_agenda_to_start")
                )
            );
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
            this._outcomes = AgendaOutcome.getDefaultOutcomes(
                outcomeType,
                doUpdateDesks
            );
            this._stateMachine.next();
            this.updateUI();
        };
        const outcomeButtonTextsAndOnClicks = [
            {
                text: locale("ui.agenda.outcome_type.for_against"),
                onClick: (button, player) => {
                    onOutcomeType(OUTCOME_TYPE.FOR_AGAINST);
                },
            },
            {
                text: locale("ui.agenda.outcome_type.player"),
                onClick: (button, player) => {
                    onOutcomeType(OUTCOME_TYPE.PLAYER);
                },
            },
            {
                text: locale("ui.agenda.outcome_type.other"),
                onClick: (button, player) => {
                    onOutcomeType(OUTCOME_TYPE.OTHER);
                },
            },
        ];
        let order;
        let bestVotes = -1;
        let outcome = "";

        switch (this._stateMachine.main) {
            case "START.MAIN":
                this._widget.setChild(
                    AgendaUiMain.simpleYesNo(
                        locale("ui.agenda.clippy.would_you_like_help"),
                        onNext,
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
                    AgendaUiMain.simple(locale("ui.agenda.clippy.whens"))
                );
                globalEvents.TI4.onTurnOrderEmpty.remove(
                    this._advanceOnTurnOrderEmpty
                );
                globalEvents.TI4.onTurnOrderEmpty.add(
                    this._advanceOnTurnOrderEmpty
                );
                order = AgendaTurnOrder.getResolveOrder();
                world.TI4.turns.setTurnOrder(order);
                world.TI4.turns.setCurrentTurn(order[0], undefined);
                break;
            case "AFTER.MAIN":
                this._widget.setChild(
                    AgendaUiMain.simple(locale("ui.agenda.clippy.afters"))
                );
                globalEvents.TI4.onTurnOrderEmpty.remove(
                    this._advanceOnTurnOrderEmpty
                );
                globalEvents.TI4.onTurnOrderEmpty.add(
                    this._advanceOnTurnOrderEmpty
                );
                order = AgendaTurnOrder.getResolveOrder();
                world.TI4.turns.setTurnOrder(order);
                world.TI4.turns.setCurrentTurn(order[0], undefined);
                break;
            case "VOTE.MAIN":
                this._widget.setChild(
                    AgendaUiMain.simple(locale("ui.agenda.clippy.voting"))
                );
                globalEvents.TI4.onTurnOrderEmpty.remove(
                    this._advanceOnTurnOrderEmpty
                );
                globalEvents.TI4.onTurnOrderEmpty.add(
                    this._advanceOnTurnOrderEmpty
                );
                order = AgendaTurnOrder.getVoteOrder();
                world.TI4.turns.setTurnOrder(order);
                world.TI4.turns.setCurrentTurn(order[0], undefined);
                break;
            case "POST.MAIN":
                this._widget.setChild(
                    AgendaUiMain.simpleNext(
                        locale("ui.agenda.clippy.post"),
                        onNext
                    )
                );
                globalEvents.TI4.onTurnOrderEmpty.remove(
                    this._advanceOnTurnOrderEmpty
                );
                globalEvents.TI4.onTurnOrderEmpty.add(
                    this._advanceOnTurnOrderEmpty
                );
                order = AgendaTurnOrder.getVoteOrder();
                world.TI4.turns.setTurnOrder(order);
                world.TI4.turns.setCurrentTurn(order[0], undefined);
                break;
            case "FINISH.MAIN":
                this._outcomes.forEach((candidate) => {
                    if (candidate.totalVotes > bestVotes) {
                        bestVotes = candidate.totalVotes;
                        outcome = candidate.name;
                    }
                });
                this._widget.setChild(
                    AgendaUiMain.simple(
                        locale("ui.agenda.clippy.outcome", { outcome })
                    )
                );
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
        for (const outcome of this._outcomes) {
            outcome.resetTexts(); // release internal references to Text objects
            outcome.setMutablePredictions(false);
            outcome.setMutableVotes(false);
        }

        // Abort if not active.
        if (!this._stateMachine) {
            return;
        }

        if (this._stateMachine.desk === "WHEN-AFTER.DESK") {
            const currentDesk = world.TI4.turns.getCurrentTurn();
            const isWhen =
                this._stateMachine && this._stateMachine.main === "WHEN.MAIN";
            for (const playerDesk of world.TI4.getAllPlayerDesks()) {
                if (
                    this._replaceWhenWithPredict &&
                    playerDesk === currentDesk
                ) {
                    for (const outcome of this._outcomes) {
                        outcome.setMutablePredictions(true);
                    }
                    const deskVote = new AgendaUiDeskPredictVote(
                        playerDesk,
                        this._outcomes,
                        this._deskIndexToAvailableVotes
                    ).attach();
                    this._deskUIs.push(deskVote);
                    deskVote.commitButton.onClicked.add((button, player) => {
                        console.log("predict finished");
                        this._replaceWhenWithPredict = false;
                        // Do not pass, can predict again
                        world.TI4.turns.endTurn();
                    });
                    continue;
                }

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
                        // Switch to predict ui.
                        this._replaceWhenWithPredict = true;
                        this.updateDeskUI();
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
            for (const outcome of this._outcomes) {
                outcome.setMutableVotes(true);
            }
            for (const playerDesk of world.TI4.getAllPlayerDesks()) {
                const deskVote = new AgendaUiDeskPredictVote(
                    playerDesk,
                    this._outcomes,
                    this._deskIndexToAvailableVotes
                ).attach();
                this._deskUIs.push(deskVote);
                deskVote.commitButton.onClicked.add((button, player) => {
                    const statusPad = TabAgenda.getStatusPad(playerDesk);
                    if (!statusPad.__getPass()) {
                        statusPad.__setPass(true);
                    }
                    world.TI4.turns.endTurn();
                });
            }
        }
    }
}

module.exports = { TabAgenda };
