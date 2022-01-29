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
    static get(player, hex, adjacentHexes) {

    }

    constructor(params) {
        this._unitAttrsSet = params && params.unitAttrsSet || new UnitAttrsSet()
        this._unitModifiers = params && params.unitModifiers || []
        
        this._unitToCount = params && params.unitToCount || {}
        this._unitToPlastic = params && params.unitToPlastic || []

        this._unitToAdjacentCount = params && params.unitToCount || {}
        this._unitToAdjacentPlastic = params && params.unitToPlastic || []
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

    unitAttrsSet() {
        return this._unitAttrsSet
    }

    unitModifiers() {
        return this._unitModifiers
    }

}

module.exports = { AuxData }