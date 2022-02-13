const assert = require("../../wrapper/assert-wrapper");
const _ = require("../../wrapper/lodash-wrapper");
const locale = require("../locale");
const { CardUtil } = require("../card/card-util");
const { Faction } = require("../faction/faction");
const { ObjectNamespace } = require("../object-namespace");
const { PlayerDesk } = require("../player-desk");
const UNIT_ATTRS = require("./unit-attrs.data");
const { world } = require("../../wrapper/api");

let _allUnitTypes = false;
let _unitToDefaultRawAttrs = false;
let _triggerNsidToUnitUpgrade = false;
let _nsidNameToUnitUpgrade = false;

function _maybeInit() {
    if (_triggerNsidToUnitUpgrade) {
        return; // already done
    }
    _triggerNsidToUnitUpgrade = {};
    _nsidNameToUnitUpgrade = {};
    for (const rawAttrs of UNIT_ATTRS) {
        if (!rawAttrs.upgradeLevel) {
            continue; // basic unit, not an upgrade
        }
        const unitUpgrade = new UnitAttrs(rawAttrs);

        // Unit override/upgrade card.
        if (rawAttrs.triggerNsid) {
            assert(!_triggerNsidToUnitUpgrade[rawAttrs.triggerNsid]);
            _triggerNsidToUnitUpgrade[rawAttrs.triggerNsid] = unitUpgrade;

            const parsed = ObjectNamespace.parseNsid(rawAttrs.triggerNsid);
            assert(!_nsidNameToUnitUpgrade[parsed.name]);
            _nsidNameToUnitUpgrade[parsed.name] = unitUpgrade;
        }
    }
}

/**
 * Mutable unit attributes.
 */
class UnitAttrs {
    /**
     * Get default UnitAttrs for unit type.  Creates a new object for mutation.
     *
     * @param {string} unit
     * @returns {UnitAttrs} new UnitAttrs object
     */
    static getDefaultUnitAttrs(unit) {
        if (!_unitToDefaultRawAttrs) {
            _unitToDefaultRawAttrs = {};
            for (const rawAttrs of UNIT_ATTRS) {
                if (!rawAttrs.upgradeLevel) {
                    assert(!_unitToDefaultRawAttrs[rawAttrs.unit]);
                    _unitToDefaultRawAttrs[rawAttrs.unit] = rawAttrs;
                }
            }
        }
        const rawAttrs = _unitToDefaultRawAttrs[unit];
        assert(rawAttrs);
        return new UnitAttrs(rawAttrs);
    }

    /**
     * Get all normal unit types.
     *
     * @returns {Array.<string>}
     */
    static getAllUnitTypes() {
        if (!_allUnitTypes) {
            _allUnitTypes = [];
            for (const rawAttrs of UNIT_ATTRS) {
                if (!rawAttrs.upgradeLevel) {
                    assert(!_allUnitTypes.includes(rawAttrs.unit));
                    _allUnitTypes.push(rawAttrs.unit);
                }
            }
        }
        return _allUnitTypes;
    }

    /**
     * Sort in increasing upgrade level order.
     *
     * @param {Array.<UnitAttrs>} upgradeAttrsArray - unit schema compliant attrs
     * @returns {Array.<UnitAttrs>} ordered (original list also mutated in place)
     */
    static sortUpgradeLevelOrder(upgradeAttrsArray) {
        upgradeAttrsArray.sort((a, b) => {
            return (a._attrs.upgradeLevel || 1) - (b._attrs.upgradeLevel || 1);
        });
        return upgradeAttrsArray;
    }

    /**
     * Lookup unit upgrade by the name portion of triggering NSID.
     * Useful for finding per-faction overrides.
     *
     * @param {string} nsidName
     * @returns {UnitAttrs}
     */
    static getNsidNameUnitUpgrade(nsidName) {
        assert(typeof nsidName === "string");
        _maybeInit();
        return _nsidNameToUnitUpgrade[nsidName];
    }

    /**
     * Find player's unit upgrades, EXCLUDES FACTION OVERRIDES!
     *
     * @param {number} playerSlot
     * @returns {Array.<UnitAttrs>} upgrades
     */
    static getPlayerUnitUpgrades(playerSlot) {
        assert(typeof playerSlot === "number");

        _maybeInit();
        const unitUpgrades = [];
        for (const obj of world.getAllObjects()) {
            const nsid = ObjectNamespace.getNsid(obj);
            const unitUpgrade = _triggerNsidToUnitUpgrade[nsid];
            if (!unitUpgrade) {
                continue; // not a candidate
            }

            if (!CardUtil.isLooseCard(obj)) {
                continue; // not a lone, faceup card on the table
            }

            // If an object has an owner, use it before trying to guess owner.
            let ownerSlot = obj.getOwningPlayerSlot();
            if (ownerSlot < 0) {
                const playerDesk = PlayerDesk.getClosest(obj.getPosition());
                ownerSlot = playerDesk.playerSlot;
            }
            if (ownerSlot !== playerSlot) {
                continue; // explit different owner
            }

            // Found a unit upgrade!  Add it to the list.
            unitUpgrades.push(unitUpgrade);
        }

        return unitUpgrades;
    }

    /**
     * Get faction-intrisic unit overrides.  These are only the base level
     * unit upgrades, higher level ones require the card in play (detected
     * by getPlayerUnitUpgrades).
     *
     * @param {Faction} faction
     * @returns {Array.<UnitAttrs>} upgrades
     */
    static getFactionUnitUpgrades(faction) {
        assert(faction instanceof Faction);

        const unitUpgrades = [];
        for (const factionUnit of faction.raw.units) {
            const unitUpgrade = UnitAttrs.getNsidNameUnitUpgrade(factionUnit);
            assert(unitUpgrade);
            // Only find base-level overrides (higher-level upgrades require the card).
            if (
                !unitUpgrade.raw.upgradeLevel ||
                unitUpgrade.raw.upgradeLevel === 1
            ) {
                unitUpgrades.push(unitUpgrade);
            }
        }
        return unitUpgrades;
    }

    // ------------------------------------------------------------------------

    /**
     * Constructor.  Makes a copy of the attrs for later mutation.
     *
     * @param {object} attrs - UnitAttrsSchema compliant object
     */
    constructor(attrs) {
        assert(typeof attrs == "object");
        this._attrs = _.cloneDeep(attrs);
    }

    /**
     * Localized unit name, accounts for unit upgrades.
     *
     * @returns {string}
     */
    get name() {
        return locale(this._attrs.localeName);
    }

    /**
     * Unit summary (for debugging).
     *
     * @returns {string}
     */
    get summary() {
        return JSON.stringify(this._attrs);
    }

    /**
     * Get the mutable underlying object.
     *
     * @returns {object}
     */
    get raw() {
        return this._attrs;
    }

    /**
     * Apply unit upgrade.
     *
     * @param {UnitAttrs} upgradeAttrs
     */
    upgrade(upgradeAttrs) {
        assert(upgradeAttrs instanceof UnitAttrs);
        assert(this._attrs.unit === upgradeAttrs._attrs.unit);
        assert(upgradeAttrs._attrs.upgradeLevel);
        assert(
            (this._attrs.upgradeLevel || 0) <= upgradeAttrs._attrs.upgradeLevel
        );

        _.merge(this._attrs, upgradeAttrs._attrs);
    }
}

// Export for unittest
module.exports = {
    UnitAttrs,
};
