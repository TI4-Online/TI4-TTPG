const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { AbstractRightClickCard } = require("./abstract-right-click-card");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { SimpleDieBuilder } = require("../../lib/dice/simple-die");
const { Card, Player, Vector, world } = require("../../wrapper/api");
const { RollGroup } = require("../../lib/dice/roll-group");
const { Broadcast } = require("../../lib/broadcast");

const ACTION_NAME = "*" + locale("ui.menu.infantry_2");
const DELETE_DIE_AFTER_N_SECONDS = 10;

class RightClickInfantry2 extends AbstractRightClickCard {
    constructor() {
        super();
    }

    init() {
        this._nsidToRollValue = {
            "card.technology.unit_upgrade:base/infantry_2": 6,
            "card.technology.unit_upgrade.sol:base/spec_ops_2": 5,
            "card.technology.unit_upgrade.arborec:base/letani_warrior_2": 6,
        };
        this._nsidSet = new Set(Object.keys(this._nsidToRollValue));
    }

    isRightClickable(card) {
        assert(card instanceof Card);
        const nsid = ObjectNamespace.getNsid(card);
        return this._nsidSet.has(nsid);
    }

    getRightClickActionNamesAndTooltips(card) {
        assert(card instanceof Card);
        return [
            {
                actionName: ACTION_NAME,
                tooltip: undefined,
            },
        ];
    }

    onRightClick(card, player, selectedActionName) {
        assert(card instanceof Card);
        assert(player instanceof Player);
        assert(typeof selectedActionName === "string");

        if (selectedActionName === ACTION_NAME) {
            this._maybeSaveInfantry(card, player);
        }
    }

    _maybeSaveInfantry(card, clickingPlayer) {
        assert(card instanceof Card);
        assert(clickingPlayer instanceof Player);

        const nsid = ObjectNamespace.getNsid(card);
        const rollValue = this._nsidToRollValue[nsid];
        console.log(
            `RightClickInfantry2._maybeSaveInfantry ${nsid} (${rollValue})`
        );

        const nsidToInfantryCount = {
            "unit:base/infantry": 1,
            "token:base/infantry_1": 1,
            "token:base/infantry_3": 3,
        };
        const extent = card.getExtent();
        let infantryCount = 0;
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            if (obj.isHeld()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            const count = nsidToInfantryCount[nsid];
            if (!count) {
                continue; // not infantry
            }
            const pos = card.worldPositionToLocal(obj.getPosition());
            if (Math.abs(pos.x) > extent.x || Math.abs(pos.y) > extent.y) {
                continue; // not on card
            }
            infantryCount += count;
        }

        console.log(
            `RightClickInfantry2._maybeSaveInfantry count=${infantryCount}`
        );

        if (infantryCount === 0) {
            return;
        }

        const dice = [];
        for (let i = 0; i < infantryCount; i++) {
            const r = i * 1.5;
            const phi = (Math.PI * 2 * i) / infantryCount;
            let pos = new Vector(Math.cos(phi) * r, Math.sin(phi) * r, 0);
            pos = card.localPositionToWorld(pos).add([0, 0, 5]);
            const die = new SimpleDieBuilder()
                .setDeleteAfterSeconds(DELETE_DIE_AFTER_N_SECONDS)
                .setHitValue(rollValue)
                .setSpawnPosition(pos)
                .build(clickingPlayer);
            dice.push(die);
        }
        RollGroup.roll(dice, (dice) => {
            const diceMessages = [];
            let totalHits = 0;
            for (const die of dice) {
                diceMessages.push(die.getValueStr());
                totalHits += die.countHits();
            }

            const playerSlot = clickingPlayer.getSlot();
            const playerName = world.TI4.getNameByPlayerSlot(playerSlot);
            const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
            const color = playerDesk.plasticColor;

            const unitMessage = [
                card.getCardDetails().name,
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
}

// Create and register self
new RightClickInfantry2();
