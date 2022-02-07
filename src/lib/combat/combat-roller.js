const assert = require("../../wrapper/assert");
const locale = require("../locale");
const { AuxData } = require("../unit/auxdata");
const { RollGroup } = require("../dice/roll-group");
const { UnitDieBuilder } = require("../dice/unit-die");
const { Player } = require("../../wrapper/api");

/**
 * Let players manually enter unit counts.
 */
class CombatRoller {
    constructor(auxData, rollType, player) {
        assert(auxData instanceof AuxData);
        assert(typeof rollType === "string");
        assert(player instanceof Player);

        this._auxData = auxData;
        this._rollType = rollType;
        this._player = player;
    }

    /**
     * Create a localized, human-readable report of active unit modifiers.
     *
     * @returns {string}
     */
    getModifiersReport(combatOnly) {
        let unitModifiers = this._auxData.unitModifiers;

        if (combatOnly) {
            unitModifiers = unitModifiers.filter((unitModifier) => {
                return unitModifier.raw.isCombat;
            });
        }

        let modifierList;
        if (unitModifiers.length > 0) {
            modifierList = unitModifiers
                .map((unitModifier) => {
                    const name = locale(unitModifier.raw.localeName);
                    const desc = locale(unitModifier.raw.localeDescription);
                    return `${name} (${desc})`;
                })
                .join(", ");
        } else {
            modifierList = locale("ui.message.none");
        }

        return locale("ui.message.roll_modifiers", {
            modifierCount: unitModifiers.length,
            modifierList,
        });
    }

    /**
     * Compute how many dice to roll for each unit type.
     *
     * @returns {Object.{string:number}} unit to dice count
     */
    getUnitToDiceCount() {
        const unitToDiceCount = {};
        for (const unitAttrs of this._auxData.unitAttrsSet.values()) {
            const unit = unitAttrs.raw.unit;
            if (!this._auxData.has(unit)) {
                continue; // no units of this type
            }
            const rollAttrs = unitAttrs.raw[this._rollType];
            if (!rollAttrs) {
                continue; // unit does not have this roll type
            }
            const unitCount = this._auxData.count(unit);
            const dicePerUnit = rollAttrs.dice || 1;
            const extraDice = rollAttrs.extraDice || 0;
            unitToDiceCount[unit] = unitCount * dicePerUnit + extraDice;
        }
        return unitToDiceCount;
    }

    /**
     * Create (but do not roll) dice.
     *
     * @param {Vector} dicePos - spawn dice "around" this position
     * @returns {Object.{string:Array.{UnitDie}}} unit to dice count
     */
    spawnDice(dicePos) {
        assert(typeof dicePos.x === "number");

        const unitToDiceCount = this.getUnitToDiceCount();
        const unitToDice = {};
        for (const [unit, diceCount] of Object.entries(unitToDiceCount)) {
            const unitAttrs = this._auxData.unitAttrsSet.get(unit);
            const spawnPos = dicePos; // XXX TODO
            const unitDieBuilder = new UnitDieBuilder(
                unitAttrs,
                this._rollType
            ).setDeleteAfterSeconds(30);
            unitToDice[unit] = [];
            for (let i = 0; i < diceCount; i++) {
                unitToDice[unit].push(
                    unitDieBuilder
                        .setSpawnPosition(spawnPos)
                        .build(this._player)
                );
            }
        }
        return unitToDice;
    }

    /**
     * Roll dice and report results.
     * Report special behaviors like crits.
     *
     * Assumes unit modifiers have already been applied to AuxData.
     *
     * @param {Vector} dicePos - spawn dice "around" this position
     * @returns {Array.{UnitDie}}
     */
    roll(dicePos) {
        assert(typeof dicePos.x === "number");

        const unitToDice = this.spawnDice(dicePos);
        const dice = [];
        for (const unitDice of Object.values(unitToDice)) {
            dice.push(...unitDice);
        }

        RollGroup.roll(dice, () => {
            this.reportRollResult(unitToDice);
        });

        return dice;
    }

    static reportRollResult(unitToDice) {
        // local item = '[HIT:' .. dice.hitValue
        // if dice.critCount and dice.critValue then
        //     item = item .. ', CRIT(x' .. (dice.critCount + 1) .. '):' .. dice.critValue
        // end
        // item = item .. ']: '
        //         table.insert(message, dice.unitName .. ' ' .. item .. table.concat(rollValues, ', '))
        // broadcastToAll(playerName .. ' rolled: [ffffff]' .. table.concat(message, ', '), playerColor)
        // broadcastToAll(playerName .. ' landed ' .. hits .. ' hit' .. (hits == 1 and '' or 's') .. '.', playerColor)
    }
}

module.exports = { CombatRoller };
