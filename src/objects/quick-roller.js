const assert = require("../wrapper/assert-wrapper");
const {
    Button,
    Canvas,
    GameObject,
    Rotator,
    UIElement,
    Vector,
    refObject,
    world,
} = require("../wrapper/api");
const { SimpleDieBuilder } = require("../lib/dice/simple-die");
const { RollGroup } = require("../lib/dice/roll-group");
const { Broadcast } = require("../lib/broadcast");
const locale = require("../lib/locale");

const DELETE_AFTER_N_SECONDS = 20;
const WAIT_MSECS_BEFORE_ROLL = 2500;

class QuickRoller {
    constructor(gameObject) {
        assert(gameObject instanceof GameObject);

        this._obj = gameObject;
        this._value = 5;
        this._buttons = [];
        this._pendingDice = [];
        this._pendingRollHandle = undefined;

        const scale = 8;
        const w = 47 * scale;
        const h = w;
        const buttonW = 8 * scale;
        const buttonH = buttonW;
        const canvas = new Canvas();

        //canvas.addChild(new Border(), 0, 0, w, h);

        const ui = new UIElement();
        ui.useWidgetSize = false;
        ui.width = w;
        ui.height = h;
        ui.position = new Vector(0, 0, 0.26);
        ui.rotation = new Rotator(0, 0, 0);
        ui.scale = 1 / scale;
        ui.widget = canvas;
        gameObject.addUI(ui);

        const r = (w / 2 - buttonW / 2) * 0.95;
        for (let i = 1; i <= 10; i++) {
            const phi = (Math.PI / 5) * i;
            const x = Math.sin(phi) * r + w / 2 - buttonW / 2;
            const y = -Math.cos(phi) * r + h / 2 - buttonH / 2;
            console.log(`xxx ${x}, ${y}`);
            const button = new Button()
                .setFontSize(30)
                .setText(i)
                .setEnabled(i !== this._value);
            button.onClicked.add((button, player) => {
                this.onClickedValue(i, player);
            });
            canvas.addChild(button, x, y, buttonW, buttonH);
            this._buttons.push(button);
        }

        const s = w * 0.4;
        const rollButton = new Button().setFontSize(70).setText("@");
        rollButton.onClicked.add((button, player) => {
            this.onClickedRoll(player);
        });
        canvas.addChild(rollButton, w / 2 - s / 2, h / 2 - s / 2, s, s);
    }

    onClickedValue(value, player) {
        this._value = value;
        this._buttons.forEach((button, index) => {
            button.setEnabled(value !== index + 1);
        });
    }

    onClickedRoll(player) {
        const yaw = Math.random() * 360;
        const d = new Vector(5, 0, 10).rotateAngleAxis(yaw, [0, 0, 1]);
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
        const report = parts.join(", ");
        let msg = locale("ui.message.player_rolled", { playerName, report });
        Broadcast.broadcastAll(msg, color);

        msg = locale("ui.message.player_landed_hits", { playerName, hits });
        Broadcast.broadcastAll(msg, color);
    }
}

refObject.onCreated.add((obj) => {
    new QuickRoller(obj);
});

if (world.getExecutionReason() === "ScriptReload") {
    new QuickRoller(refObject);
}
