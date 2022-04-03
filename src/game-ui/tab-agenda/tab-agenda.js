const assert = require("../../wrapper/assert-wrapper");
const { AgendaStateMachine } = require("./agenda-state-machine");
const { AgendaTurnOrder } = require("./agenda-turn-order");
const { AgendaUiDeskWhenAfter } = require("./agenda-ui-desk-when-after");
const { AgendaUiMainAfter } = require("./agenda-ui-main-after");
const { AgendaUiMainBlank } = require("./agenda-ui-main-blank");
const { AgendaUiMainOutcomeType } = require("./agenda-ui-main-outcome-type");
const { AgendaUiMainStart } = require("./agenda-ui-main-start");
const { AgendaUiMainWhen } = require("./agenda-ui-main-when");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { LayoutBox, globalEvents, world } = require("../../wrapper/api");

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
        this._noWhensSet = new Set();
        this._noAftersSet = new Set();
        this._deskWhenAfters = [];

        // Once-only event that resets early pass indicators and advances the state.
        this._advanceOnTurnOrderEmpty = () => {
            if (this._stateMachine) {
                this._stateMachine.next();
            }
            this.updateUI();
            // Only trigger once.
            globalEvents.TI4.onTurnOrderEmpty.remove(
                this._advanceOnTurnOrderEmpty
            );
        };

        globalEvents.TI4.onAgendaChanged.add((agendaCard) => {
            if (agendaCard) {
                this._stateMachine = new AgendaStateMachine();
            } else {
                this._stateMachine = undefined;
            }
            this._noWhensSet = new Set();
            this._noAftersSet = new Set();
            this.updateUI();
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
            }
        );

        this.updateUI();
    }

    getUI() {
        return this._widget;
    }

    updateUI() {
        // Always clear when-afters, recreate if in use.
        for (const deskWhenAfter of this._deskWhenAfters) {
            deskWhenAfter.detach();
        }
        this._deskWhenAfters = [];

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
            // TODO XXX
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
                world.TI4.turns.setTurnOrder(order);
                world.TI4.turns.setCurrentTurn(order[0], undefined);
                globalEvents.TI4.onTurnOrderEmpty.remove(
                    this._advanceOnTurnOrderEmpty
                );
                globalEvents.TI4.onTurnOrderEmpty.add(
                    this._advanceOnTurnOrderEmpty
                );
                break;
            case "AFTER.MAIN":
                this._widget.setChild(new AgendaUiMainAfter(this._doRefresh));
                order = AgendaTurnOrder.getResolveOrder();
                world.TI4.turns.setTurnOrder(order);
                world.TI4.turns.setCurrentTurn(order[0], undefined);
                globalEvents.TI4.onTurnOrderEmpty.remove(
                    this._advanceOnTurnOrderEmpty
                );
                globalEvents.TI4.onTurnOrderEmpty.add(
                    this._advanceOnTurnOrderEmpty
                );
                break;
            default:
                throw new Error(`unknown state "${this._stateMachine.main}"`);
        }

        if (this._stateMachine.desk === "WHEN-AFTER.DESK") {
            for (const playerDesk of world.TI4.getAllPlayerDesks()) {
                const deskWhenAfter = new AgendaUiDeskWhenAfter(
                    playerDesk
                ).attach();
                deskWhenAfter.anyWhens.setIsChecked(
                    !this._noWhensSet.has(playerDesk.index)
                );
                deskWhenAfter.anyWhens.onCheckStateChanged.add(
                    (checkBox, player, isChecked) => {
                        console.log(
                            `onCheckStateChanged ${playerDesk.colorName} ${isChecked}`
                        );
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
                deskWhenAfter.playCard.onClicked.add((button, player) => {
                    if (world.TI4.turns.getCurrentTurn() === playerDesk) {
                        world.TI4.turns.endTurn();
                    }
                });
                this._deskWhenAfters.push(deskWhenAfter);
            }
        }
    }
}

module.exports = { TabAgenda };
