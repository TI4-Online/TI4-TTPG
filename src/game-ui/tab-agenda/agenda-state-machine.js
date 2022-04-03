const assert = require("../../wrapper/assert-wrapper");

/**
 * main: main UI state
 * active: active player's desk (missing for none)
 * waiting: not-active players' desks (missing for none)
 * next: "continue" to this state
 */
const STATES = {
    START: {
        main: "START.MAIN",
        next: "OUTCOME_TYPE",
    },
    OUTCOME_TYPE: {
        main: "OUTCOME_TYPE.MAIN",
        next: "WHEN",
    },
    WHEN: {
        main: "WHEN.MAIN",
        active: ["WHEN.START", "WHEN.FINISH"],
        waiting: "WHEN.WAITING",
        next: "AFTER",
    },
    AFTER: {
        main: "AFTER.MAIN",
        active: ["AFTER.START", "AFTER.FINISH"],
        waiting: "AFTER.WAITING",
        next: "VOTE",
    },
    VOTE: {
        main: "VOTE.MAIN",
        active: ["VOTE.START", "VOTE.FINISH"],
        waiting: "VOTE.WAITING",
        next: "FINISH",
    },
    FINISH: {
        main: "FINISH.MAIN",
        next: "START",
    },
};

class AgendaStateMachine {
    constructor() {
        this._state = STATES.START;
        this._activeStateIndex = 0;
    }

    get main() {
        return this._state.main;
    }

    get active() {
        const activeList = this._state.active || [];
        return activeList[this._activeStateIndex];
    }

    get waiting() {
        return this._state.waiting;
    }

    /**
     * Advance the active state.  If the current state has an active state
     * list advance the index.  If at the end or if no active state list,
     * move to the "next" state.
     *
     * @returns {AgendaStateMachine} self, for chaining
     */
    next() {
        this._activeStateIndex += 1;
        const activeList = this._state.active || [];
        if (this._activeStateIndex < activeList.length) {
            return; // moved to next active state
        }
        // Move to the next state, reset index.
        this._state = STATES[this._state.next];
        this._activeStateIndex = 0;
        assert(this._state);
        return this;
    }
}

module.exports = { AgendaStateMachine };
