const assert = require("../../../wrapper/assert-wrapper");
const {
    Border,
    Button,
    Color,
    LayoutBox,
    Text,
    TextJustification,
    VerticalAlignment,
    world,
} = require("../../../wrapper/api");

/**
 * Simple turn order entry, swaps between a button that sets turn to player,
 * or a label (if it is currently this player's turn).
 */
class TurnEntrySimple extends Border {
    static updateArray(entries, config) {
        const playerDeskOrder = world.TI4.turns.getTurnOrder();
        const currentDesk = world.TI4.turns.getCurrentTurn();
        const passedPlayerSlotSet = world.TI4.turns.getPassedPlayerSlotSet();
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            const playerDesk = playerDeskOrder[i];
            const playerSlot = playerDesk?.playerSlot;
            config.isTurn = playerDesk === currentDesk;
            config.isPassed = passedPlayerSlotSet.has(playerSlot);
            entry.update(playerDesk, config);
        }
    }

    constructor() {
        super();

        this._playerDesk = undefined;

        // Create button and label, configure and swap in update.
        this._button = new Button();
        this._button.onClicked.add((clickedButton, clickingPlayer) => {
            world.TI4.turns.setCurrentTurn(this._playerDesk, clickingPlayer);
        });
        this._label = new Text().setJustification(TextJustification.Center);

        // Simple layout:
        // 1. outer border (self)
        // 2. padding to see outer border
        // 3. (swap between label and button)
        const p = 1;
        this._labelBox = new LayoutBox().setPadding(p, p, p, p);

        this.setChild(this._labelBox);
    }

    update(playerDesk, config) {
        assert(playerDesk);
        assert(typeof config === "object");
        assert(typeof config.fontSize === "number");
        assert(typeof config.fitNameLength === "number");
        assert(typeof config.isTurn === "boolean");
        assert(typeof config.isPassed === "boolean");

        // Needed for set turn clicked.
        this._playerDesk = playerDesk;
        this._button.setEnabled(config.enableButtons);

        const playerSlot = playerDesk.playerSlot;
        const player = world.getPlayerBySlot(playerSlot);

        let name = player && player.getName();
        if (!name || name.length === 0) {
            name = `<${playerDesk.colorName}>`;
        }
        let fontSizeScale = config.fitNameLength / name.length;
        fontSizeScale = Math.min(fontSizeScale, 1);
        fontSizeScale = Math.max(fontSizeScale, 0.5);
        const fontSize = config.fontSize * fontSizeScale;

        // Select between label and button depending on is turn.
        let label = config.isTurn ? this._label : this._button;
        if (!config.enableButtons) {
            label = this._label;
        }
        const fit = config.isTurn
            ? VerticalAlignment.Center
            : VerticalAlignment.Fill;
        label.setText(name).setFontSize(fontSize);
        this._labelBox.setVerticalAlignment(fit);
        if (this._labelBox.getChild() !== label) {
            this._labelBox.setChild(label);
        }

        // Color.
        const v1 = 0.03;
        const v2 = 0.05;
        const plrColor = playerDesk.plasticColor;
        const altColor = new Color(v1, v1, v1);
        const passColor = new Color(v2, v2, v2);

        const fgColor = config.isTurn ? altColor : plrColor;
        let bgColor = config.isPassed ? passColor : plrColor;
        if (!config.enableButtons) {
            bgColor = config.isTurn ? plrColor : altColor;
        }

        this.setColor(bgColor);
        label.setTextColor(fgColor);
    }
}

module.exports = { TurnEntrySimple };
