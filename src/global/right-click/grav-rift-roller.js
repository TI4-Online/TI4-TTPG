const { Vector, UIElement, Text, Color, Border } = require("../../wrapper/api");
const { SimpleDieBuilder } = require("../../lib/dice/simple-die");
const { RollGroup, FancyRollGroup } = require("../../lib/dice/roll-group");
const locale = require("../../lib/locale");
const { Broadcast } = require("../../lib/broadcast");
const { AuxDataBuilder } = require("../../lib/unit/auxdata");
const { Hex } = require("../../lib/hex");
const { AuxDataPair } = require("../../lib/unit/auxdata-pair");
const { UnitPlastic } = require("../../lib/unit/unit-plastic");

const DELETE_DIE_AFTER_N_SECONDS = 10;
const DELETE_LABEL_AFTER_N_MSECS = 15000;
const WAIT_MSECS_BEFORE_ROLL = 2500;
const GRAV_RIFT_SUCCCESS = 4;
const LABEL_FONT_SIZE = 8;

class SimpleGravRiftRoller {
    static {
        this._pendingDice = [];
        this._pendingRollHandle = undefined;
    }

    /**
     * Rolls a D10 and reports gravity rift result.
     *
     * 1-3 = failure, 4-10 = success.
     *
     * @param {GameObject} systemTileObj
     * @param {Player} player
     * @returns
     */
    static roll(systemTileObj, player) {
        const yaw = Math.random() * 360;
        const d = new Vector(5, 0, 10).rotateAngleAxis(yaw, [0, 0, 1]);
        const pos = systemTileObj.getPosition().add(d);
        const simpleDie = new SimpleDieBuilder()
            .setDeleteAfterSeconds(DELETE_DIE_AFTER_N_SECONDS)
            .setHitValue(GRAV_RIFT_SUCCCESS)
            .setSpawnPosition(pos)
            .build(player);
        this._pendingDice.push(simpleDie);

        if (!this._pendingRollHandle) {
            clearTimeout(this._pendingRollHandle);
        }
        this._pendingRollHandle = setTimeout(() => {
            SimpleGravRiftRoller.doRoll(player);
        }, WAIT_MSECS_BEFORE_ROLL);
    }

    static doRoll(player) {
        const dice = this._pendingDice;
        this._pendingDice = [];
        this._pendingRollHandle = undefined;
        RollGroup.roll(dice, (dice) => {
            SimpleGravRiftRoller.onRollFinished(dice, player);
        });
    }

    static onRollFinished(dice, player) {
        const playerSlot = player.getSlot();
        const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
        const deskName = playerDesk ? playerDesk.colorName : player.getName();
        const faction = world.TI4.getFactionByPlayerSlot(playerSlot);
        const playerName = faction ? faction.nameFull : deskName;
        const color = playerDesk ? playerDesk.color : player.getPlayerColor();

        const parts = [];
        for (const die of dice) {
            if (die.isHit()) {
                parts.push(
                    locale("ui.message.roll.gravRiftSuccess", {
                        value: die.getValue(),
                    })
                );
            } else {
                parts.push(
                    locale("ui.message.roll.gravRiftFailure", {
                        value: die.getValue(),
                    })
                );
            }
        }
        const prefix = locale("ui.message.roll.gravRift", { playerName });
        const msg = prefix + parts.join(" ");
        Broadcast.broadcastAll(msg, color);
    }
}

class AutoGravRiftRoller {
    /**
     * Rolls a D10 for each ship with movement in the system.
     *
     * 1-3 = failure, 4-10 = success.
     *
     * Reports result per ship by adding temporary label to ship.
     *
     * @param {GameObject} systemTileObj
     * @param {Player} player
     * @returns
     */
    static roll(systemTileObj, player) {
        const system = world.TI4.getSystemBySystemTileObject(systemTileObj);
        const playerSlot = player.getSlot();
        const faction = world.TI4.getFactionByPlayerSlot(playerSlot);
        const hex = Hex.fromPosition(systemTileObj.getPosition());

        // get per-unit data.
        const auxData = new AuxDataBuilder()
            .setPlayerSlot(playerSlot)
            .setFaction(faction)
            .build();

        // Apply unit upgrades.
        new AuxDataPair(auxData, new AuxDataBuilder().build()).fillPairSync();

        const hexPlastic = UnitPlastic.getAll().filter(
            (plastic) => plastic.hex === hex
        );

        const plasticWithMovement = hexPlastic.filter((plastic) => {
            const unit = plastic.unit;
            const attrs = auxData.unitAttrsSet.get(unit);
            return attrs.raw.move > 0;
        });

        const diceObjects = [];
        plasticWithMovement.forEach((unit) => {
            for (var i = 0; i < unit._count; i++) {
                const yaw = Math.random() * 360;
                const d = new Vector(5, 0, 10).rotateAngleAxis(yaw, [0, 0, 1]);
                const pos = systemTileObj.getPosition().add(d);
                const die = new SimpleDieBuilder()
                    .setDeleteAfterSeconds(DELETE_DIE_AFTER_N_SECONDS)
                    .setHitValue(GRAV_RIFT_SUCCCESS)
                    .setSpawnPosition(pos)
                    .build(player);
                diceObjects.push([die, unit, i]);
            }
        });
        FancyRollGroup.roll(diceObjects, (diceObjects) => {
            AutoGravRiftRoller.onRollFinished(diceObjects, player);
        });
    }

    static onRollFinished(diceObjects, player) {
        const playerSlot = player.getSlot();
        const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
        const deskName = playerDesk ? playerDesk.colorName : player.getName();
        const faction = world.TI4.getFactionByPlayerSlot(playerSlot);
        const playerName = faction ? faction.nameFull : deskName;
        const color = playerDesk ? playerDesk.color : player.getPlayerColor();

        const parts = [];
        for (const [die, unit, index] of diceObjects) {
            AutoGravRiftRoller.addLabel(die, unit, index, player);
            if (die.isHit()) {
                parts.push(
                    locale("ui.message.roll.autoGravRiftSuccess", {
                        value: die.getValue(),
                        unit: unit.unit,
                    })
                );
            } else {
                parts.push(
                    locale("ui.message.roll.autoGravRiftFailure", {
                        value: die.getValue(),
                        unit: unit.unit,
                    })
                );
            }
        }
        const prefix = locale("ui.message.roll.gravRift", { playerName });
        const msg = prefix + parts.join(" ");
        Broadcast.broadcastAll(msg, color);
    }

    static addLabel(die, unit, index, player) {
        const gameObject = unit.gameObject;
        const label = new UIElement();
        label.widget = new Border();
        label.position = new Vector(index * 2.5, 0, 1.5);
        if (die.isHit()) {
            const msg = locale("ui.message.roll.autoGravRiftSuccess", {
                value: die.getValue(),
                unit: unit.unit,
            });
            label.widget.setChild(
                new Text().setText(msg).setFontSize(LABEL_FONT_SIZE)
            );
        } else {
            const msg = locale("ui.message.roll.autoGravRiftFailure", {
                value: die.getValue(),
                unit: unit.unit,
            });
            label.widget.setChild(
                new Text()
                    .setText(msg)
                    .setFontSize(LABEL_FONT_SIZE)
                    .setTextColor(new Color(255, 0, 0))
            );
        }
        const localRot = gameObject.worldRotationToLocal(player.getRotation());
        label.rotation.yaw = localRot.yaw;
        gameObject.addUI(label);
        setTimeout(() => {
            gameObject.removeUI(0);
        }, DELETE_LABEL_AFTER_N_MSECS);
    }
}

module.exports = { SimpleGravRiftRoller, AutoGravRiftRoller };
