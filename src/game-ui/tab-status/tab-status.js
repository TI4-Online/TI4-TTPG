const {
    DealActionCards,
    EndStatusPhase,
} = require("../../lib/phase/end-of-round");
const { TabStatusUI } = require("./tab-status-ui");
const { ThrottleClickHandler } = require("../../lib/ui/throttle-click-handler");

class TabStatus {
    constructor() {
        const onButtonCallbacks = {
            dealActionCards: (button, player) => {
                DealActionCards.dealToAll();

                EndStatusPhase.returnCommandTokens(); // return before distribute
                EndStatusPhase.repairShips();
                EndStatusPhase.refreshCards();
                EndStatusPhase.resetPassedFlags();

                // Mantis says: "the gain tokens should be part of the deal
                // action cards button instead of the end status phase.  there
                // are edge case scenarios where token allocation is based on
                // expected strat card picks and technically tokens are
                // allocated before the window for political stability.
                // someone knowing they got to keep leadership might allocate
                // differently than risking a sabo"
                EndStatusPhase.distributeCommandTokens();
            },
            endStatusPhase: (button, player) => {
                EndStatusPhase.returnStrategyCards();
            },
        };
        ThrottleClickHandler.wrapValues(onButtonCallbacks);

        this._ui = new TabStatusUI(onButtonCallbacks);
    }

    getUI() {
        return this._ui;
    }
}

module.exports = { TabStatus };
