const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { AuxDataBuilder } = require("../../lib/unit/auxdata");
const { AuxDataPair } = require("../../lib/unit/auxdata-pair");
const { Broadcast } = require("../../lib/broadcast");
const { Hex } = require("../../lib/hex");
const { RollGroup } = require("../../lib/dice/roll-group");
const { SimpleDieBuilder } = require("../../lib/dice/simple-die");
const { UnitPlastic } = require("../../lib/unit/unit-plastic");
const { Color, DrawingLine, Vector, world } = require("../../wrapper/api");

const DELETE_DIE_AFTER_N_SECONDS = 10;
const DELETE_LABEL_AFTER_N_MSECS = 15 * 1000;
const WAIT_MSECS_BEFORE_ROLL = 2500;
const GRAV_RIFT_SUCCCESS = 4;

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

        // Fighters need to roll in some cases like skilled retreat, etc.
        // Don't get clever, just always roll for ships.
        const plasticWithMovement = hexPlastic.filter((plastic) => {
            const unit = plastic.unit;
            const attrs = auxData.unitAttrsSet.get(unit);
            return attrs.raw.move > 0 || attrs.raw.ship;
        });

        const dice = [];
        plasticWithMovement.forEach((unit) => {
            for (var i = 0; i < unit._count; i++) {
                const yaw = Math.random() * 360;
                const d = new Vector(5, 0, 10).rotateAngleAxis(yaw, [0, 0, 1]);
                const pos = systemTileObj.getPosition().add(d);
                const die = new SimpleDieBuilder()
                    .setDeleteAfterSeconds(DELETE_DIE_AFTER_N_SECONDS)
                    .setHitValue(GRAV_RIFT_SUCCCESS)
                    .setSpawnPosition(pos)
                    .setAuxObject(unit)
                    .build(player);
                dice.push(die);
            }
        });
        RollGroup.roll(dice, (dice) => {
            AutoGravRiftRoller.onRollFinished(dice, player);
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
            const unit = die.getAuxObject();
            assert(unit);
            AutoGravRiftRoller.addLines(die, unit);
            if (die.isHit()) {
                parts.push(
                    locale("ui.message.roll.autoGravRiftSuccess", {
                        value: die.getValue(),
                        unit: locale("unit." + unit.unit),
                    })
                );
            } else {
                parts.push(
                    locale("ui.message.roll.autoGravRiftFailure", {
                        value: die.getValue(),
                        unit: locale("unit." + unit.unit),
                    })
                );
            }
        }
        const prefix = locale("ui.message.roll.gravRift", { playerName });
        const msg = prefix + parts.join(" ");
        Broadcast.broadcastAll(msg, color);
    }

    static createDrawingLineRings(gameObject, color, thickness) {
        const extent = gameObject.getExtent();
        extent.z = Math.max(extent.z, 1);
        const points = [];
        const normals = [];
        const num = 32;
        const scale = 1.5;
        for (let i = 0; i < num; i++) {
            const phi = (Math.PI * 2 * i) / num;
            const point = new Vector(
                0,
                extent.y * scale * Math.cos(phi),
                extent.z * scale * Math.sin(phi)
            );
            points.push(point);
            normals.push(point.clampVectorMagnitude(1, 1));
        }
        points.push(points[0].clone());
        normals.push(normals[0].clone());

        // Pointing outward.
        const outwardLine = new DrawingLine();
        outwardLine.color = color;
        outwardLine.points = points;
        outwardLine.normals = normals;
        outwardLine.rounded = false;
        outwardLine.thickness = thickness;

        // Pointing inward.
        const flipped = normals.map((normal) => {
            return normal.negate();
        });
        const inwardLine = new DrawingLine();
        inwardLine.color = color;
        inwardLine.points = points;
        inwardLine.normals = flipped;
        inwardLine.rounded = false;
        inwardLine.thickness = thickness;

        return { outwardLine, inwardLine };
    }

    static addLines(die, unit, startTimeoutOnGrabbed) {
        const gameObject = unit.gameObject;

        const removeLines = () => {
            while (gameObject.getDrawingLines().length > 0) {
                gameObject.removeDrawingLine(0);
            }
        };
        removeLines();

        const surviveColor = new Color(0, 0, 255); // use blue instead of green for colorblind
        const destroyColor = new Color(255 / 255, 105 / 255, 30 / 255);

        const color = die.isHit() ? surviveColor : destroyColor;
        const thickness = die.isHit() ? 0.3 : 0.6;

        const { outwardLine, inwardLine } =
            AutoGravRiftRoller.createDrawingLineRings(
                gameObject,
                color,
                thickness
            );
        gameObject.addDrawingLine(outwardLine);
        gameObject.addDrawingLine(inwardLine);

        // Remove after a moment.
        let delay = DELETE_LABEL_AFTER_N_MSECS;
        if (!die.isHit()) {
            delay *= 2; // keep lines longer for removed ships
        }

        const delayedRemoveLines = () => {
            setTimeout(() => {
                removeLines();
            }, delay);
        };

        if (!startTimeoutOnGrabbed) {
            delayedRemoveLines();
        } else {
            gameObject.onGrab.add(() => {
                delayedRemoveLines();
            });
        }
    }
}

module.exports = { SimpleGravRiftRoller, AutoGravRiftRoller };
