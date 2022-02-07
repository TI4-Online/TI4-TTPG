const assert = require("../../wrapper/assert");
const locale = require("../locale");
const { AuxData } = require("../unit/auxdata");
const { RollGroup } = require("../dice/roll-group");
const { UnitDieBuilder } = require("../dice/unit-die");
const { UnitModifier } = require("../unit/unit-modifier");
const { Player } = require("../../wrapper/api");

/**
 * Let players manually enter unit counts.
 */
class MultiRoller {
    constructor() {}

    /**
     * Create a localized, human-readable report of active unit modifiers.
     *
     * @param {Array.{UnitModifier}} auxData
     * @returns {string}
     */
    static getModifiersReport(unitModifiers, combatOnly) {
        assert(Array.isArray(unitModifiers));
        unitModifiers.forEach((unitModifier) => {
            assert(unitModifier instanceof UnitModifier);
        });

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
     * @param {AuxData} auxData - unit counts and attributes
     * @param {string} rollType - antiFighterBarrage, etc
     * @returns {Object.{string:number}} unit to dice count
     */
    static getUnitToDiceCount(auxData, rollType) {
        assert(auxData instanceof AuxData);
        assert(typeof rollType === "string");

        const unitToDiceCount = {};
        for (const unitAttrs of auxData.unitAttrsSet.values()) {
            const unit = unitAttrs.raw.unit;
            if (!auxData.has(unit)) {
                continue; // no units of this type
            }
            const rollAttrs = unitAttrs.raw[rollType];
            if (!rollAttrs) {
                continue; // unit does not have this roll type
            }
            const unitCount = auxData.count(unit);
            const dicePerUnit = rollAttrs.dice || 1;
            const extraDice = rollAttrs.extraDice || 0;
            unitToDiceCount[unit] = unitCount * dicePerUnit + extraDice;
        }
        return unitToDiceCount;
    }

    /**
     * Create (but do not roll) dice.
     *
     * @param {AuxData} auxData - unit counts and attributes
     * @param {string} rollType - antiFighterBarrage, etc
     * @param {Player} player
     * @param {Vector} dicePos - spawn dice "around" this position
     * @returns {Object.{string:Array.{UnitDie}}} unit to dice count
     */
    static spawnDice(auxData, rollType, player, dicePos) {
        assert(auxData instanceof AuxData);
        assert(typeof rollType === "string");
        assert(player instanceof Player);
        assert(typeof dicePos.x === "number");

        const unitToDiceCount = this.getUnitToDiceCount(auxData, rollType);
        const unitToDice = {};
        for (const [unit, diceCount] of Object.entries(unitToDiceCount)) {
            const unitAttrs = auxData.unitAttrsSet.get(unit);
            const spawnPos = dicePos; // XXX TODO
            const unitDieBuilder = new UnitDieBuilder(
                unitAttrs,
                rollType
            ).setDeleteAfterSeconds(30);
            unitToDice[unit] = [];
            for (let i = 0; i < diceCount; i++) {
                unitToDice[unit].push(
                    unitDieBuilder.setSpawnPosition(spawnPos).build(player)
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
     * @param {AuxData} auxData - unit counts and attributes
     * @param {string} rollType - antiFighterBarrage, etc
     * @param {Vector} dicePos - spawn dice "around" this position
     * @returns {Array.{UnitDie}}
     */
    static roll(auxData, rollType, player, dicePos) {
        assert(auxData instanceof AuxData);
        assert(typeof rollType === "string");
        assert(player instanceof Player);
        assert(typeof dicePos.x === "number");

        const unitToDice = this.spawnDice(auxData, rollType, player, dicePos);
        const dice = [];
        for (const unitDice of Object.values(unitToDice)) {
            dice.push(...unitDice);
        }

        RollGroup.roll(dice, () => {
            this.reportRollResult(auxData, unitToDice);
        });

        return dice;
    }

    static reportRollResult(auxData, unitToDice) {}
}

module.exports = { MultiRoller };
