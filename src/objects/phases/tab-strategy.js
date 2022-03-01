const {
    PlaceTradegoodUnpicked,
} = require("../../lib/phase/place-tradegood-unpicked");
const { FindTurnOrder } = require("../../lib/phase/find-turn-order");
const { TabStrategyUI } = require("./tab-strategy-ui");
const { world } = require("../../wrapper/api");
const { Broadcast } = require("../../lib/broadcast");
const locale = require("../../lib/locale");

class TabStrategy {
    constructor() {
        const onButtonCallbacks = {
            placeTradeGoodsAndSetTurns: (button, player) => {
                PlaceTradegoodUnpicked.placeAll();
                const slotOrder = FindTurnOrder.order();

                const slotToColor = {};
                for (const playerDesk of world.TI4.getAllPlayerDesks()) {
                    slotToColor[playerDesk.playerSlot] = playerDesk.colorName;
                }

                const colorOrder = slotOrder.map((slot) => slotToColor[slot]);
                const msg = locale("ui.message.turn_order", {
                    turnOrder: colorOrder.join(", "),
                });
                Broadcast.chatAll(msg);
            },
        };

        this._ui = new TabStrategyUI(onButtonCallbacks);
    }

    getUI() {
        return this._ui;
    }
}

module.exports = { TabStrategy };
