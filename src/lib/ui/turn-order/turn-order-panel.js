const assert = require("../../../wrapper/assert-wrapper");
const locale = require("../../../lib/locale");
const { TurnEntryFancy } = require("./turn-entry-fancy");
const { TurnEntrySimple } = require("./turn-entry-simple");
const { WidgetFactory } = require("../widget-factory");
const { globalEvents, world } = require("../../../wrapper/api");

class TurnOrderPanel {
    constructor() {
        this._verticalBox = WidgetFactory.verticalBox().setChildDistance(0);

        this._config = {
            fontSize: 20,
            fitNameLength: 100,
            enableButtons: true,
        };
        this._useFancyWidgets = false;
        this._addEndTurnButton = false;

        this._turnOrderEntries = undefined;
        this._endTurnButton = undefined;

        // Let other handlers finish, system process.  When a player joins
        // they may not have a name yet.
        let pending = false;
        const delayedUpdate = () => {
            if (!pending) {
                pending = true;
                world.TI4.asyncTaskQueue.add(() => {
                    pending = false;
                    this.update();
                });
            }
        };

        // Register listeners.
        if (!world.__isMock) {
            globalEvents.TI4.onTurnOrderChanged.add(delayedUpdate);
            globalEvents.TI4.onTurnOrderEmpty.add(delayedUpdate);
            globalEvents.TI4.onTurnChanged.add(delayedUpdate);
            globalEvents.TI4.onTurnPassedChanged.add(delayedUpdate);
            globalEvents.TI4.onPlayerColorChanged.add(delayedUpdate);
            globalEvents.TI4.onPlayerCountChanged.add(delayedUpdate);
            globalEvents.TI4.onPlayerJoinedDelayed.add(delayedUpdate); // do less work on immediate join
            globalEvents.onPlayerSwitchedSlots.add(delayedUpdate);
            globalEvents.TI4.onFactionChanged.add(delayedUpdate); // fancy shows faction
            globalEvents.TI4.onStrategyCardMovementStopped.add(delayedUpdate); // fancy shows strat cards
            globalEvents.TI4.onScored.add(delayedUpdate); // fancy shows score

            setInterval(delayedUpdate, 3000);
        }

        this.update();
    }

    getWidget() {
        return this._verticalBox;
    }

    setFontSize(value) {
        this._config.fontSize = value;
        this.update();
        return this;
    }

    setFitNameLength(value) {
        this._config.fitNameLength = value;
        this.update();
        return this;
    }

    setSpacing(value) {
        assert(typeof value === "number");
        this._verticalBox.setChildDistance(value);
        return this;
    }

    setAddEndTurnButton(value) {
        this._addEndTurnButton = value;
        this._turnOrderEntries = undefined; // invalidate
        this.update();
        return this;
    }

    setEnableButtons(value) {
        this._config.enableButtons = value;
        this.update();
        return this;
    }

    setUseFancyWidgets(value) {
        this._useFancyWidgets = value;
        this._turnOrderEntries = undefined; // invalidate
        this.update();
        return this;
    }

    update() {
        const playerDeskOrder = world.TI4.turns.getTurnOrder();
        if (
            !this._turnOrderEntries ||
            this._turnOrderEntries.length !== playerDeskOrder.length
        ) {
            this._turnOrderEntries = [];
            WidgetFactory.removeAllChildren(this._verticalBox);
            for (let i = 0; i < playerDeskOrder.length; i++) {
                let entry;
                if (this._useFancyWidgets) {
                    entry = new TurnEntryFancy();
                } else {
                    entry = new TurnEntrySimple();
                }
                this._turnOrderEntries.push(entry);
                this._verticalBox.addChild(entry, 1);
            }
            if (this._addEndTurnButton) {
                const endTurnButton = WidgetFactory.button().setText(
                    locale("ui.button.end_turn")
                );
                endTurnButton.setFontSize(this._config.fontSize);
                endTurnButton.onClicked.add((button, player) => {
                    if (world.TI4.turns.isActivePlayer(player)) {
                        world.TI4.turns.endTurn(player);
                    }
                });
                this._verticalBox.addChild(endTurnButton, 1.5);
            }
        }

        if (this._useFancyWidgets) {
            TurnEntryFancy.updateArray(this._turnOrderEntries, this._config);
        } else {
            TurnEntrySimple.updateArray(this._turnOrderEntries, this._config);
        }
    }
}

module.exports = { TurnOrderPanel };
