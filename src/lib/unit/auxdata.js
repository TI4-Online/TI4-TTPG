const assert = require('../../wrapper/assert')
const { UnitAttrs } = require('./unit-attrs')
const { UnitAttrsSet } = require('./unit-attrs-set')
const { UnitModifier } = require('./unit-modifier')
const { UnitPlastic } = require('./unit-plastic')
const { Player } = require('../../wrapper/api')

/**
 * Repository for per-player unit state.
 * 
 * UnitModifiers get mutable auxData.self and auxData.opponent, including
 * adding new unit types (e.g. "Experimental Battlestation") but note they 
 * should also override the count for such injected units.
 */
class AuxData {
    static createForPair(player1, player2, hex, adjacentHexes) {
        assert(player1 instanceof Player)
        assert(player2 instanceof Player)
        assert(typeof hex === 'string')
        assert(adjacentHexes instanceof Set)

        const aux1 = new AuxData()
        const aux2 = new AuxData()

        // Count units.

        // Apply unit upgrades.
        const upgrades1 = UnitAttrs.getPlayerUnitUpgrades(player1)
        const upgrades2 = UnitAttrs.getPlayerUnitUpgrades(player2)
        aux1.unitAttrsSet.upgrade(upgrades1)
        aux2.unitAttrsSet.upgrade(upgrades2)

        // Get modifiers.  For each perspective get "self modifiers" and 
        // "opponent modifiers applied to opponent".
        const modifiers1self = UnitModifier.getPlayerUnitModifiers(player1, 'self')
        const modifiers1opponenent = UnitModifier.getPlayerUnitModifiers(player2, 'opponent')
        const modifiers2self = UnitModifier.getPlayerUnitModifiers(player2, 'self')
        const modifiers2opponenent = UnitModifier.getPlayerUnitModifiers(player1, 'opponent')
        aux1.unitModifiers.push(...modifiers1self)
        aux1.unitModifiers.push(...modifiers1opponenent)
        aux2.unitModifiers.push(...modifiers2self)
        aux2.unitModifiers.push(...modifiers2opponenent)
        UnitModifier.sortPriorityOrder(aux1.unitModifiers)
        UnitModifier.sortPriorityOrder(aux2.unitModifiers)

        // As the final step, apply modifiers (receive AuxData).
        // Modifiers that dig deep into opponent unit attributes may race with
        // other modifiers (e.g. one makes units ships, another counts ships).
        // Conceivably could make multiple passes, but most 
        for (const unitAttrs of aux1.unitAttrsSet.values()) {
            if (unitAttrs.unitModifier) {
                unitAttrs.unitModifier.apply(aux1.unitAttrsSet, { self : aux1, opponent : aux2 })
            }
        }
        for (const unitModifier of aux1.unitModifiers) {
            unitModifier.apply(aux1.unitAttrsSet, { self : aux1, opponent : aux2 })
        }
        for (const unitAttrs of aux2.unitAttrsSet.values()) {
            if (unitAttrs.unitModifier) {
                unitAttrs.unitModifier.apply(aux2.unitAttrsSet, { self : aux2, opponent : aux1 })
            }
        }
        for (const unitModifier of aux2.unitModifiers) {
            unitModifier.apply(aux2.unitAttrsSet, { self : aux2, opponent : aux1 })
        }
        return [ aux1, aux2 ]
    }

    constructor() {
        this._unitAttrsSet = new UnitAttrsSet()
        this._unitModifiers = []
        
        this._unitToCount = {}
        this._unitToPlastic = []

        this._unitToAdjacentCount = {}
        this._unitToAdjacentPlastic = []
    }

    has(unit) {
        assert(typeof unit === 'string')
        return this.count(unit) > 0
    }

    count(unit) {
        assert(typeof unit === 'string')
        return this._unitToCount[unit] || 0
    }

    overrideCount(unit, value) {
        assert(typeof unit === 'string')
        assert(typeof value === 'number')
        this._unitToCount[unit] = value
    }

    get unitAttrsSet() {
        return this._unitAttrsSet
    }

    get unitModifiers() {
        return this._unitModifiers
    }

}

module.exports = { AuxData }