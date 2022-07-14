const assert = require("../../wrapper/assert-wrapper");

/**
 * name: state name, same as key
 * main: main UI state
 * active: active player's desk (missing for none)
 * waiting: not-active players' desks (missing for none)
 * next: "continue" to this state
 */
const STATES = [
    {
        name: "WAITING_FOR_START",
        main: "WAITING_FOR_START.MAIN",
        next: "OUTCOME_TYPE",
    },
    {
        name: "OUTCOME_TYPE",
        main: "OUTCOME_TYPE.MAIN",
        next: "WHEN",
    },
    {
        name: "WHEN",
        main: "WHEN.MAIN",
        desk: "WHEN-AFTER-VOTE.DESK",
        next: "AFTER",
    },
    {
        name: "AFTER",
        main: "AFTER.MAIN",
        desk: "WHEN-AFTER-VOTE.DESK",
        next: "VOTE",
    },
    {
        name: "VOTE",
        main: "VOTE.MAIN",
        desk: "WHEN-AFTER-VOTE.DESK",
        next: "FINISH", // skip the post window, let players handle it
    },
    // {
    //     // bribery window
    //     name: "POST",
    //     main: "POST.MAIN",
    //     desk: "WHEN-AFTER-VOTE.DESK",
    //     next: "FINISH",
    // },
    {
        name: "FINISH",
        main: "FINISH.MAIN",
        next: "WAITING_FOR_START",
    },
];

class AgendaStateMachine {
    constructor() {
        this._nameToState = {};
        for (const state of STATES) {
            assert(typeof state.name === "string");
            assert(!this._nameToState[state.name]);
            this._nameToState[state.name] = state;
        }
        this._state = this._nameToState["WAITING_FOR_START"];
        assert(this._state);
    }

    get name() {
        return this._state.name;
    }

    get main() {
        return this._state.main;
    }

    get desk() {
        return this._state.desk;
    }

    /**
     * Advance the active state.  If the current state has an active state
     * list advance the index.  If at the end or if no active state list,
     * move to the "next" state.
     *
     * @returns {AgendaStateMachine} self, for chaining
     */
    next() {
        this._state = this._nameToState[this._state.next];
        assert(this._state);
        //console.log(`AgendaStateMachine: entering ${this._state.main}`);
        return this;
    }

    setState(key) {
        this._state = this._nameToState[key];
        assert(this._state);
        return this;
    }
}

module.exports = { AgendaStateMachine, STATES };
