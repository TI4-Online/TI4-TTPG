const assert = require("../../wrapper/assert-wrapper");
const { AgendaStateMachine } = require("./agenda-state-machine");
const { AgendaTurnOrder } = require("./agenda-turn-order");
const { AgendaUiBlank } = require("./agenda-ui-blank");
const { AgendaUiOutcomeType } = require("./agenda-ui-outcome-type");
const { AgendaUiStart } = require("./agenda-ui-start");
const { AgendaUiWhenMain } = require("./agenda-ui-when-main");
const { LayoutBox, globalEvents, world } = require("../../wrapper/api");

class TabAgenda {
    constructor(doRefresh) {
        assert(typeof doRefresh === "function");

        this._doRefresh = doRefresh;
        this._widget = new LayoutBox();
        this._stateMachine = undefined;

        globalEvents.TI4.onAgendaChanged.add((agendaCard) => {
            if (agendaCard) {
                this._stateMachine = new AgendaStateMachine();
            } else {
                this._stateMachine = undefined;
            }
            this.updateUI();
        });

        this.updateUI();
    }

    getUI() {
        return this._widget;
    }

    updateUI() {
        if (!this._stateMachine) {
            this._widget.setChild(new AgendaUiBlank());
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
                    new AgendaUiStart().setNext(onNext).setCancel(onCancel)
                );
                break;
            case "OUTCOME_TYPE.MAIN":
                this._widget.setChild(
                    new AgendaUiOutcomeType()
                        .setNext(onNext)
                        .setOutcomeTypeListener(onOutcomeType)
                );
                break;
            case "WHEN.MAIN":
                this._widget.setChild(new AgendaUiWhenMain(this._doRefresh));
                order = AgendaTurnOrder.getResolveOrder();
                world.TI4.turns.setTurnOrder(order);
                world.TI4.turns.setCurrentTurn(order[0], undefined);
                break;
            default:
                throw new Error(`unknown state "${this._stateMachine.main}"`);
        }
    }
}

module.exports = { TabAgenda };
