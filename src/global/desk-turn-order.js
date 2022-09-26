const assert = require("../wrapper/assert-wrapper");
const locale = require("../lib/locale");
const {
    Border,
    Button,
    Color,
    HorizontalBox,
    LayoutBox,
    UIElement,
    Vector,
    VerticalBox,
    globalEvents,
    world,
} = require("../wrapper/api");

const HEIGHT = 32;
const WIDTH = 400; // UI scale is 10x world
let _deskTurnOrders = [];

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Show turn order, end turn button in front of desk.
 */
class DeskTurnOrder {
    static resetAll() {
        for (const deskTurnOrder of _deskTurnOrders) {
            deskTurnOrder.removeUI();
        }
        _deskTurnOrders = [];
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            const playerSlot = playerDesk.playerSlot;
            const deskTurnOrder = new DeskTurnOrder(playerSlot).addUI();
            _deskTurnOrders.push(deskTurnOrder);
        }
    }

    static updateAll(resetTurnOrder) {
        const passedPlayerSlotSet = world.TI4.turns.getPassedPlayerSlotSet();
        for (const deskTurnOrder of _deskTurnOrders) {
            deskTurnOrder.update(resetTurnOrder, passedPlayerSlotSet);
        }
    }

    constructor(playerSlot) {
        assert(typeof playerSlot === "number");

        this._playerSlot = playerSlot;
        this._border = undefined;
        this._endTurnButton = new Button();
        this._turnOrderPanel = new HorizontalBox();
        this._ui = undefined;

        this._onEndTurnClicked = (button, player) => {
            const active = world.TI4.turns.isActivePlayer(player);
            if (active) {
                world.TI4.turns.endTurn(player);
            } else {
                const playerName = world.TI4.getNameByPlayerSlot(
                    player.getSlot()
                );
                const msg = locale("ui.error.not_owner", { playerName });
                player.showMessage(msg);
            }
        };
    }

    removeUI() {
        if (this._ui) {
            world.removeUIElement(this._ui);
            this._ui = undefined;
        }
        return this;
    }

    addUI() {
        if (this._ui) {
            this.removeUI();
        }

        this._endTurnButton = new Button().setFontSize(12);
        this._turnOrderPanel = new HorizontalBox();
        this._border = new Border();

        this._endTurnButton.onClicked.add(this._onEndTurnClicked);

        const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(
            this._playerSlot
        );
        const pos = playerDesk.localPositionToWorld(new Vector(42, 0, 0));
        pos.z = world.getTableHeight() + 0.01;

        const panel = new VerticalBox()
            .setChildDistance(0)
            .addChild(this._endTurnButton, 9)
            .addChild(this._turnOrderPanel, 1);

        const box = new LayoutBox()
            .setChild(panel)
            .setMinimumWidth(WIDTH)
            .setMaximumWidth(WIDTH)
            .setMinimumHeight(HEIGHT)
            .setMaximumHeight(HEIGHT);

        this._ui = new UIElement();
        this._ui.position = pos;
        this._ui.rotation = playerDesk.rot;
        this._ui.anchorY = 1; // bottom
        this._ui.widget = this._border.setChild(box);

        world.addUI(this._ui);
        return this;
    }

    update(resetTurnOrder, passedPlayerSlotSet) {
        assert(typeof resetTurnOrder === "boolean");
        assert(passedPlayerSlotSet instanceof Set);

        const current = world.TI4.turns.getCurrentTurn();
        const currentName = current ? current.colorName : "?";

        const isActive = current.playerSlot === this._playerSlot;
        let endTurnButtonText = undefined;

        const v = 0.1;
        const gray = new Color(v, v, v, 1);
        this._border.setColor(isActive ? current.plasticColor : gray);

        if (isActive) {
            endTurnButtonText = locale("ui.button.your_turn_end_turn", {
                current: currentName.toUpperCase(),
            });
        } else {
            const next = world.TI4.turns.getNextTurn();
            const nextName = next ? next.colorName : "?";
            endTurnButtonText = locale("ui.button.current_and_next_turn", {
                current: capitalizeFirstLetter(currentName),
                next: capitalizeFirstLetter(nextName),
            });
        }
        this._endTurnButton.setText(endTurnButtonText);
        this._endTurnButton.setEnabled(isActive);

        if (resetTurnOrder) {
            this._turnOrderPanel.removeAllChildren();
            for (const playerDesk of world.TI4.turns.getTurnOrder()) {
                const inner = new Border().setColor(playerDesk.plasticColor);
                this._turnOrderPanel.addChild(inner, 1);
            }
        }

        // Passed?
        const black = new Color(0, 0, 0, 1);
        world.TI4.turns.getTurnOrder().forEach((playerDesk, index) => {
            const passed = passedPlayerSlotSet.has(playerDesk.playerSlot);
            const color = passed ? black : playerDesk.plasticColor;
            const inner = this._turnOrderPanel.getChildAt(index);
            if (inner) {
                inner.setColor(color);
            }
        });
    }
}

const initHandler = () => {
    globalEvents.onTick.remove(initHandler);
    DeskTurnOrder.resetAll();
    DeskTurnOrder.updateAll(true);
};
globalEvents.onTick.add(initHandler);

globalEvents.TI4.onPlayerCountChanged.add(() => {
    DeskTurnOrder.resetAll();
    DeskTurnOrder.updateAll(true);
});
globalEvents.TI4.onPlayerColorChanged.add(() => {
    DeskTurnOrder.resetAll();
    DeskTurnOrder.updateAll(true);
});

globalEvents.TI4.onTurnOrderChanged.add(() => {
    DeskTurnOrder.updateAll(true);
});
globalEvents.TI4.onTurnChanged.add(() => {
    DeskTurnOrder.updateAll(false);
});
globalEvents.TI4.onTurnPassedChanged.add(() => {
    DeskTurnOrder.updateAll(false);
});
