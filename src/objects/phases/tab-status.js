const {
    DealActionCards,
    EndStatusPhase,
} = require("../../lib/phase/end-of-round");
const { TabStatusUI } = require("./tab-status-ui");

class TabStatus {
    constructor() {
        const onButtonCallbacks = {
            dealActionCards: (button, player) => {
                DealActionCards.dealToAll();
            },
            endStatusPhase: (button, player) => {
                EndStatusPhase.returnCommandTokens();
                EndStatusPhase.repairShips();
                EndStatusPhase.refreshCards();
                EndStatusPhase.distributeCommandTokens();
                EndStatusPhase.returnStrategyCards();
                EndStatusPhase.resetPassedFlags();
            },
        };

        this._ui = new TabStatusUI(onButtonCallbacks);
    }

    getUI() {
        return this._ui;
    }
}

module.exports = { TabStatus };
