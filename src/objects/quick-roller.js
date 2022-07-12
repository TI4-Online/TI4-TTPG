const assert = require("../wrapper/assert-wrapper");
const locale = require("../lib/locale");
const { Broadcast } = require("../lib/broadcast");
const { ColorUtil } = require("../lib/color/color-util");
const { RollGroup } = require("../lib/dice/roll-group");
const { SimpleDieBuilder } = require("../lib/dice/simple-die");
const {
    Border,
    Button,
    Canvas,
    GameObject,
    Rotator,
    UIElement,
    Vector,
    refObject,
    world,
} = require("../wrapper/api");

const DELETE_AFTER_N_SECONDS = 20;
const WAIT_MSECS_BEFORE_ROLL = 2500;

class QuickRoller {
    constructor(gameObject) {
        assert(gameObject instanceof GameObject);

        this._obj = gameObject;
        this._value = 5;
        this._buttons = [];
        this._borders = [];
        this._pendingDice = [];
        this._pendingRollHandle = undefined;

        const scale = 8;
        const w = 85 * scale;
        const h = w;
        const buttonW = 15 * scale;
        const buttonH = buttonW;
        const canvas = new Canvas();

        const ui = new UIElement();
        ui.useWidgetSize = false;
        ui.width = w;
        ui.height = h;
        ui.position = new Vector(0, 0, 0.5);
        ui.rotation = new Rotator(0, 0, 0);
        ui.scale = 1 / scale;
        ui.widget = canvas;
        gameObject.addUI(ui);

        const r = (w / 2 - buttonW / 2) * 0.95;
        for (let i = 1; i <= 10; i++) {
            const phi = (Math.PI / 5) * i;
            const x = Math.sin(phi) * r + w / 2 - buttonW / 2;
            const y = -Math.cos(phi) * r + h / 2 - buttonH / 2;
            const button = new Button().setFontSize(60).setText(i);
            button.onClicked.add((button, player) => {
                this.onClickedValue(i, player);
            });
            this._buttons.push(button);

            const border = new Border().setChild(button);
            this._borders.push(border);

            canvas.addChild(border, x, y, buttonW, buttonH);
        }

        const s = w * 0.4;
        const rollButton = new Button().setFontSize(140).setText("@");
        rollButton.onClicked.add((button, player) => {
            this.onClickedRoll(player);
        });
        canvas.addChild(rollButton, w / 2 - s / 2, h / 2 - s / 2, s, s);

        this.update();
    }

    update() {
        for (let i = 0; i < this._buttons.length; i++) {
            const active = this._value === i + 1;
            this._buttons[i].setEnabled(!active);

            const colorHex = active ? "#ff0000" : "#000000";
            const color = ColorUtil.colorFromHex(colorHex);
            this._borders[i].setColor(color);
        }
    }

    onClickedValue(value, player) {
        this._value = value;
        this.update();
    }

    onClickedRoll(player) {
        const yaw = Math.random() * 360;
        const d = new Vector(7, 0, 10).rotateAngleAxis(yaw, [0, 0, 1]);
        const pos = this._obj.getPosition().add(d);
        const simpleDie = new SimpleDieBuilder()
            .setDeleteAfterSeconds(DELETE_AFTER_N_SECONDS)
            .setHitValue(this._value)
            .setSpawnPosition(pos)
            .build(player);
        this._pendingDice.push(simpleDie);

        if (!this._pendingRollHandle) {
            clearTimeout(this._pendingRollHandle);
        }
        this._pendingRollHandle = setTimeout(() => {
            this.doRoll(player);
        }, WAIT_MSECS_BEFORE_ROLL);
    }

    doRoll(player) {
        const dice = this._pendingDice;
        this._pendingDice = [];
        this._pendingRollHandle = undefined;
        RollGroup.roll(dice, (dice) => {
            this.onRollFinished(dice, player);
        });
    }

    onRollFinished(dice, player) {
        console.log("onRollFinished");

        const playerSlot = player.getSlot();
        const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
        const deskName = playerDesk ? playerDesk.colorName : player.getName();
        const faction = world.TI4.getFactionByPlayerSlot(playerSlot);
        const playerName = faction ? faction.nameFull : deskName;
        const color = playerDesk ? playerDesk.color : player.getPlayerColor();

        const parts = [];
        let hits = 0;
        for (const die of dice) {
            if (die.isHit()) {
                hits += 1;
            }
            parts.push(die.getValueStr());
        }

        const prefix = `[${locale("ui.message.roll.hit")}:${this._value}] `;
        const report = prefix + parts.join(", ");
        let msg = locale("ui.message.player_rolled", { playerName, report });
        Broadcast.broadcastAll(msg, color);

        msg = locale("ui.message.player_landed_hits", { playerName, hits });
        Broadcast.broadcastAll(msg, color);
    }
}

let _createOnlyOnceCalled = false;
const createOnlyOnce = (obj) => {
    assert(obj instanceof GameObject);
    if (_createOnlyOnceCalled || world.__isMock) {
        return;
    }
    _createOnlyOnceCalled = true;
    new QuickRoller(obj);
};

refObject.onCreated.add((obj) => {
    // DO NOT CREATE UI IN ONCREATED CALLBACK, IT WILL LINGER ACROSS RELOAD
    // AND PROBABLY CAUSES OTHER PROBLEMS.
    process.nextTick(() => {
        createOnlyOnce(obj);
    });
});

if (world.getExecutionReason() === "ScriptReload") {
    process.nextTick(() => {
        createOnlyOnce(refObject);
    });
}
