const assert = require("../../wrapper/assert-wrapper");
const {
    Border,
    GameObject,
    HorizontalBox,
    Text,
    TextJustification,
    globalEvents,
    world,
} = require("../../wrapper/api");

class TurnOrderPanel extends HorizontalBox {
    constructor(gameObject) {
        assert(!gameObject || gameObject instanceof GameObject);
        super();

        const update = (playerDeskOrder, player) => {
            this.update();
        };

        // Register listeners.
        globalEvents.TI4.onTurnOrderChanged.add(update);
        globalEvents.TI4.onTurnChanged.add(update);
        globalEvents.TI4.onPlayerColorChanged.add(update);
        globalEvents.TI4.onPlayerCountChanged.add(update);
        globalEvents.onPlayerSwitchedSlots.add(update);

        // Unregister listeners when destroyed.
        if (gameObject) {
            gameObject.onDestroyed.add(() => {
                globalEvents.TI4.onTurnOrderChanged.remove(update);
                globalEvents.TI4.onTurnChanged.remove(update);
                globalEvents.TI4.onPlayerColorChanged.remove(update);
                globalEvents.TI4.onPlayerCountChanged.remove(update);
                globalEvents.onPlayerSwitchedSlots.remove(update);
            });
        }

        this.update();
    }

    update() {
        const playerDeskOrder = world.TI4.turns.getTurnOrder();
        assert(Array.isArray(playerDeskOrder));

        while (this.getChildAt(0)) {
            this.removeChildAt(0);
        }

        const currentDesk = world.TI4.turns.getCurrentTurn();
        for (const playerDesk of playerDeskOrder) {
            const isTurn = playerDesk === currentDesk;
            const player = world.getPlayerBySlot(playerDesk.playerSlot);
            let name = player && player.getName();
            if (!name || name.length === 0) {
                name = `<${playerDesk.colorName}>`;
            }
            const label = new Text()
                .setText(name)
                .setTextColor([0, 0, 0, 1])
                .setJustification(TextJustification.Center);
            const inner = new Border()
                .setColor(playerDesk.color)
                .setChild(label);

            const frame = new Border().setChild(inner);

            const outer = new Border().setChild(frame);
            if (isTurn) {
                outer.setColor([1, 0, 0, 1]);
            }

            this.addChild(outer, 1);
        }
    }
}

module.exports = { TurnOrderPanel };
