const assert = require('../../wrapper/assert')
const { UnitAttrs } = require('./unit-attrs')
const { UnitAttrsSet } = require('./unit-attrs-set')
const { UnitModifier } = require('./unit-modifier')
const { UnitPlastic } = require('./unit-plastic')

/**
 * Repository for per-player unit state.
 * 
 * UnitModifiers get mutable auxData.self and auxData.opponent, including
 * adding new unit types (e.g. "Experimental Battlestation") but note they 
 * should also override the count for such injected units.
 */
class AuxData {

    static createForPair(playerSlot1, playerSlot2, hex, adjacentHexes) {
        assert(typeof playerSlot1 === 'number')
        assert(typeof playerSlot2 === 'number')
        assert(typeof hex === 'string')
        assert(adjacentHexes instanceof Set)

        // Get plastic, group into per-unit hex and adjacent sets.
        const allPlastic = UnitPlastic.getAll()
        const hexPlastic = allPlastic.filter(plastic => plastic.hex === hex)
        const adjPlastic = allPlastic.filter(plastic => adjacentHexes.has(plastic.hex))
        UnitPlastic.assignTokens(hexPlastic)
        UnitPlastic.assignTokens(adjPlastic)
        const unitToHexPlastic = {}
        const unitToAdjPlastic = {}
        for (const plastic of hexPlastic) {
            if (!unitToHexPlastic[plastic.unit]) {
                unitToHexPlastic[plastic.unit] = []
            }
            unitToHexPlastic[plastic.unit].push(plastic)
        }
        for (const plastic of adjPlastic) {
            if (!unitToAdjPlastic[plastic.unit]) {
                unitToAdjPlastic[plastic.unit] = []
            }
            unitToAdjPlastic[plastic.unit].push(plastic)
        }

        // Create and fill in for a single player.
        const createSolo = (selfSlot, opponentSlot) => {
            assert(typeof selfSlot === 'number')
            assert(typeof opponentSlot === 'number')

            const aux = new AuxData()

            // Get hex and adjacent plastic for this player.
            // Also get counts, beware of x3 tokens!
            for (const [unit, hexPlastic] of Object.entries(unitToHexPlastic)) {
                const playerPlastic = hexPlastic.filter(plastic => plastic.owningPlayerSlot == selfSlot)
                aux.plastic(unit).push(...playerPlastic)
                let count = playerPlastic.reduce((value, plastic) => value + plastic.count, 0)
                aux.overrideCount(unit, count)
            }
            for (const [unit, adjPlastic] of Object.entries(unitToAdjPlastic)) {
                const playerPlastic = adjPlastic.filter(plastic => plastic.owningPlayerSlot == selfSlot)
                aux.adjacentPlastic(unit).push(...playerPlastic)
                let count = playerPlastic.reduce((value, plastic) => value + plastic.count, 0)
                aux.overrideAdjacentCount(unit, count)
            }

            // Apply unit upgrades.
            const upgrades = UnitAttrs.getPlayerUnitUpgrades(selfSlot)
            for (const upgrade of upgrades) {
                aux.unitAttrsSet.upgrade(upgrade)
            }

            // Get modifiers.  For each perspective get "self modifiers" and 
            // "opponent modifiers applied to opponent".
            const modifiersSelf = UnitModifier.getPlayerUnitModifiers(selfSlot, 'self')
            const modifiersOpponent = UnitModifier.getPlayerUnitModifiers(opponentSlot, 'opponent')
            aux.unitModifiers.push(...modifiersSelf)
            aux.unitModifiers.push(...modifiersOpponent)
            UnitModifier.sortPriorityOrder(aux.unitModifiers)

            return aux
        }
        const aux1 = createSolo(playerSlot1, playerSlot2)
        const aux2 = createSolo(playerSlot2, playerSlot1)

        // As the final step, apply modifiers (receive AuxData).
        // Modifiers that dig deep into opponent unit attributes may race with
        // other modifiers (e.g. one makes units ships, another counts ships).
        // Conceivably could make multiple passes, but most only care about own type.
        const applyModifiers = (selfAux, opponentAux) => {
            assert(selfAux instanceof AuxData)
            assert(opponentAux instanceof AuxData)

            for (const unitAttrs of selfAux.unitAttrsSet.values()) {
                if (unitAttrs.raw.unitModifier) {
                    const unitModifier = new UnitModifier(unitAttrs.raw.unitModifier)
                    unitModifier.apply(selfAux.unitAttrsSet, { self : selfAux, opponent : opponentAux })
                }
            }
            for (const unitModifier of selfAux.unitModifiers) {
                unitModifier.apply(selfAux.unitAttrsSet, { self : selfAux, opponent : opponentAux })
            }
        }
        applyModifiers(aux1, aux2)
        applyModifiers(aux2, aux1)

        return [ aux1, aux2 ]
    }

    constructor() {
        this._unitAttrsSet = new UnitAttrsSet()
        this._unitModifiers = []
        
        this._unitToCount = {}
        this._unitToAdjacentCount = {}

        this._unitToPlastic = []
        this._unitToAdjacentPlastic = []
    }

    has(unit) {
        assert(typeof unit === 'string')
        return this.count(unit) > 0
    }

    hasAdjacent(unit) {
        assert(typeof unit === 'string')
        return this.adjacentCount(unit) > 0
    }

    count(unit) {
        assert(typeof unit === 'string')
        return this._unitToCount[unit] || 0
    }

    adjacentCount(unit) {
        assert(typeof unit === 'string')
        return this._unitToAdjacentCount[unit] || 0
    }

    overrideCount(unit, value) {
        assert(typeof unit === 'string')
        assert(typeof value === 'number')
        this._unitToCount[unit] = value
    }

    overrideAdjacentCount(unit, value) {
        assert(typeof unit === 'string')
        assert(typeof value === 'number')
        this._unitToAdjacentCount[unit] = value
    }

    get unitAttrsSet() {
        return this._unitAttrsSet
    }

    get unitModifiers() {
        return this._unitModifiers
    }

    plastic(unit) {
        assert(typeof unit === 'string')
        let result = this._unitToPlastic[unit]
        if (!result) {
            result = []
            this._unitToPlastic[unit] = result
        }
        return result
    }

    adjacentPlastic(unit) {
        assert(typeof unit === 'string')
        let result = this._unitToAdjacentPlastic[unit]
        if (!result) {
            result = []
            this._unitToAdjacentPlastic[unit] = result
        }
        return result
    }
}

module.exports = { AuxData }