const {
    PlaceTradegoodUnpicked,
} = require("../../lib/phase/place-tradegood-unpicked");
const { FindTurnOrder } = require("../../lib/phase/find-turn-order");
const { TabStrategyUI } = require("./tab-strategy-ui");
const { world } = require("../../wrapper/api");

class TabStrategy {
    constructor() {
        const onButtonCallbacks = {
            placeTradeGoodsAndSetTurns: (button, player) => {
                PlaceTradegoodUnpicked.placeAll();
                const playerDeskOrder = FindTurnOrder.order();
                world.TI4.turns.setTurnOrder(playerDeskOrder, player);
                world.TI4.turns.setCurrentTurn(playerDeskOrder[0], player);
            },
        };

        this._ui = new TabStrategyUI(onButtonCallbacks);
    }

    getUI() {
        return this._ui;
    }
}

module.exports = { TabStrategy };
