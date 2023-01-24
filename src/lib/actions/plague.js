const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { Broadcast } = require("../../lib/broadcast");
const { CardUtil } = require("../card/card-util");
const { Hex } = require("../hex");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { RollGroup } = require("../../lib/dice/roll-group");
const { SimpleDieBuilder } = require("../../lib/dice/simple-die");
const { UnitPlastic } = require("../unit/unit-plastic");
const { Player, Vector, world } = require("../../wrapper/api");

const DELETE_DIE_AFTER_N_SECONDS = 10;

class Plague {
    static isPlagueActive() {
        const plagueNsid = "card.action:base/plague";
        const checkIsDiscardPile = true;
        const allowFaceDown = false;
        for (const obj of world.getAllObjects()) {
            if (!CardUtil.isLooseCard(obj, checkIsDiscardPile, allowFaceDown)) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid === plagueNsid) {
                console.log("Plague: isPlagueActive true");
                return true;
            }
        }
        return false;
    }

    static plague(systemTileObj, planet, player) {
        assert(typeof systemTileObj === "object");
        assert(typeof planet === "object");
        assert(player instanceof Player);

        // Get infantry on planet.
        const pos = systemTileObj.getPosition();
        const hex = Hex.fromPosition(pos);
        const infantryInSystem = UnitPlastic.getAll().filter((unit) => {
            return unit.hex === hex && unit.unit === "infantry";
        });
        UnitPlastic.assignPlanets(infantryInSystem);

        let infantryCount = 0;
        for (const infantry of infantryInSystem) {
            if (infantry.planet === planet) {
                infantryCount += infantry.count;
            }
        }

        const playerSlot = player.getSlot();
        const playerName = world.TI4.getNameByPlayerSlot(playerSlot);
        const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
        const color = playerDesk.plasticColor;

        const planetName = planet.getNameStr();
        const msg = locale("plague.message", { planetName, infantryCount });
        Broadcast.chatAll(msg, color);

        if (infantryCount === 0) {
            return;
        }

        const rollValue = 6;
        const dice = [];
        for (let i = 0; i < infantryCount; i++) {
            const r = i * 1.5;
            const phi = (Math.PI * 2 * i) / infantryCount;
            let pos = new Vector(Math.cos(phi) * r, Math.sin(phi) * r, 0);
            pos = playerDesk.localPositionToWorld(pos).add([0, 0, 5]);
            const die = new SimpleDieBuilder()
                .setDeleteAfterSeconds(DELETE_DIE_AFTER_N_SECONDS)
                .setHitValue(rollValue)
                .setSpawnPosition(pos)
                .build(player);
            dice.push(die);
        }
        RollGroup.roll(dice, (dice) => {
            const diceMessages = [];
            let totalHits = 0;
            for (const die of dice) {
                diceMessages.push(die.getValueStr());
                totalHits += die.countHits();
            }

            const unitMessage = [
                locale("plague.roll_name"),
                " [",
                locale("ui.message.roll.hit"),
                ":",
                rollValue,
                "]: ",
                diceMessages.join(", "),
            ].join("");

            const rolled = locale("ui.message.player_rolled", {
                playerName,
                report: unitMessage,
            });
            const landed = locale("ui.message.player_landed_hits", {
                playerName,
                hits: totalHits,
            });
            const message = rolled + "\n" + landed;
            Broadcast.chatAll(message, color);
        });
    }

    constructor() {}
}

module.exports = { Plague };
