const assert = require("../../wrapper/assert-wrapper");
const {
    Border,
    GameObject,
    HorizontalBox,
    Text,
    globalEvents,
    world,
} = require("../../wrapper/api");

class TurnOrderPanel extends HorizontalBox {
    constructor(gameObject) {
        assert(!gameObject || gameObject instanceof GameObject);
        super();

        const onTurnOrderChanged = (playerDeskOrder, player) => {
            this._onTurnOrderChanged(playerDeskOrder);
        };
        const onTurnChanged = (currentPlayerDesk, previousPlayerDesk) => {
            this._onTurnChanged(currentPlayerDesk);
        };

        // Register listeners.
        globalEvents.TI4.onTurnOrderChanged.add(onTurnOrderChanged);
        globalEvents.TI4.onTurnChanged.add(onTurnChanged);

        // Unregister listeners when destroyed.
        if (gameObject) {
            gameObject.onDestroyed.add(() => {
                globalEvents.TI4.onTurnOrderChanged.remove(onTurnOrderChanged);
                globalEvents.TI4.onTurnChanged.remove(onTurnChanged);
            });
        }

        this._onTurnOrderChanged(world.TI4.turns.getTurnOrder());
    }

    _onTurnOrderChanged(playerDeskOrder) {
        assert(Array.isArray(playerDeskOrder));

        while (this.getChildAt(0)) {
            this.removeChildAt(0);
        }
        for (const playerDesk of playerDeskOrder) {
            const label = new Text()
                .setText(playerDesk.colorName)
                .setTextColor([0, 0, 0, 1]);
            const border = new Border()
                .setColor(playerDesk.color)
                .setChild(label);
            this.addChild(border, 1);
        }
    }

    _onTurnChanged(currentPlayerDesk) {}
}

module.exports = { TurnOrderPanel };
