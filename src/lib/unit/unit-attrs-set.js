const assert = require("assert");
const { UnitAttrs } = require("./unit-attrs");

/**
 * Manage a set from unit type string to mutable UnitAttrs object.
 */
class UnitAttrsSet {
    /**
     * Constructor.  Create set with basic units.
     */
    constructor() {
        this._unitTypeToUnitAttrs = {};
        for (const unit of UnitAttrs.getAllUnitTypes()) {
            this._unitTypeToUnitAttrs[unit] =
                UnitAttrs.getDefaultUnitAttrs(unit);
        }
    }

    /**
     * Get a specific unit's UnitAttrs.
     *
     * @param {string} unit
     * @returns {UnitAttrs}
     */
    get(unit) {
        assert(typeof unit === "string");
        return this._unitTypeToUnitAttrs[unit];
    }

    /**
     * Get all UnitAttrs in the set.
     *
     * @returns {Array.<UnitAttrs>}
     */
    values() {
        return Object.values(this._unitTypeToUnitAttrs);
    }

    /**
     * Apply unit upgrade to the correct unit.
     *
     * @param {UnitAttrs} upgradeAttrs
     */
    upgrade(upgradeAttrs) {
        assert(upgradeAttrs instanceof UnitAttrs);
        const unitAttrs = this._unitTypeToUnitAttrs[upgradeAttrs.raw.unit];
        assert(unitAttrs);
        unitAttrs.upgrade(upgradeAttrs);
    }

    /**
     * Add a new non-standard unit (e.g. Experimental Battlestation)
     *
     * @param {UnitAttrs} unitAttrs
     */
    addSpecialUnit(unitAttrs) {
        assert(unitAttrs instanceof UnitAttrs);
        assert(!this._unitTypeToUnitAttrs[unitAttrs.raw.unit]);
        this._unitTypeToUnitAttrs[unitAttrs.raw.unit] = unitAttrs;
    }
}

module.exports = { UnitAttrsSet };
