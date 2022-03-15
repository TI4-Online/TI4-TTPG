const assert = require("../../wrapper/assert-wrapper");
const {
    Border,
    Color,
    GameObject,
    HorizontalBox,
    LayoutBox,
    Text,
    TextJustification,
    globalEvents,
    world,
} = require("../../wrapper/api");

class TurnOrderPanel extends HorizontalBox {
    constructor(gameObject) {
        assert(!gameObject || gameObject instanceof GameObject);
        super();

        this._fontSize = undefined;

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

    setFontSize(value) {
        this._fontSize = value;
        this.update();
        return this;
    }

    setSpacing(value) {
        assert(typeof value === "number");
        this.setChildDistance(value);
        return this;
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
                .setJustification(TextJustification.Center);
            if (this._fontSize) {
                label.setFontSize(this._fontSize);
            }
            const inner = new Border().setChild(label);

            const p = 1;
            const innerBox = new LayoutBox()
                .setPadding(p, p, p, p)
                .setChild(inner);

            const outer = new Border().setChild(innerBox);

            const v = 0.05;
            const plrColor = playerDesk.plasticColor;
            const altColor = new Color(v, v, v);
            const fgColor = isTurn ? altColor : plrColor;
            const bgColor = isTurn ? plrColor : altColor;

            outer.setColor(plrColor);
            inner.setColor(bgColor);
            label.setTextColor(fgColor);

            this.addChild(outer, 1);
        }
    }
}

module.exports = { TurnOrderPanel };
