const assert = require("../../wrapper/assert-wrapper");
const locale = require("../locale");
const { ObjectNamespace } = require("../object-namespace");
const { PlayerDesk } = require("../player-desk");
const { UnitModifierSchema } = require("./unit-modifier.schema");
const { world, Card } = require("../../wrapper/api");
const UNIT_MODIFIERS = require("./unit-modifier.data");

const PRIORITY = {
    "mutate.early": 9,
    mutate: 10,
    "mutate.late": 11,
    "adjust.early": 19,
    adjust: 20,
    "adjust.late": 21,
    "choose.early": 29,
    choose: 30,
    "choose.late": 30,
};

const OWNER = {
    self: true,
    opponent: true,
    any: true,
};

let _triggerNsidToUnitModifier = false;
let _factionAbilityToUnitModifier = false;
let _unitAbilityToUnitModifier = false;

function _maybeInit() {
    if (_triggerNsidToUnitModifier) {
        return; // already initialized
    }
    _triggerNsidToUnitModifier = {};
    _factionAbilityToUnitModifier = {};
    _unitAbilityToUnitModifier = {};

    for (const rawModifier of UNIT_MODIFIERS) {
        const unitModifier = new UnitModifier(rawModifier);

        if (rawModifier.triggerNsid) {
            _triggerNsidToUnitModifier[rawModifier.triggerNsid] = unitModifier;
        }
        if (rawModifier.triggerNsids) {
            for (const triggerNsid of rawModifier.triggerNsids) {
                assert(!_triggerNsidToUnitModifier[triggerNsid]);
                _triggerNsidToUnitModifier[triggerNsid] = unitModifier;
            }
        }

        if (rawModifier.triggerFactionAbility) {
            const ability = rawModifier.triggerFactionAbility;
            assert(!_factionAbilityToUnitModifier[ability]);
            _factionAbilityToUnitModifier[ability] = unitModifier;
        }

        if (rawModifier.triggerUnitAbility) {
            const ability = rawModifier.triggerUnitAbility;
            assert(!_unitAbilityToUnitModifier[ability]);
            _unitAbilityToUnitModifier[ability] = unitModifier;
        }
    }
}

/**
 * A unit modifier mutates one or more unit attributes.
 *
 * Modifiers may have `applyEach(UnitData)` and `applyAll(UnitTypeToUnitData)`.
 * `applyEach` is for simple modifiers, called separately for each unit type.
 * `applyAll` is for modifiers that need to see all units at once, for instance
 * to choose the "best" to receive a bonus.
 */
class UnitModifier {
    /**
     * Sort in apply order.
     *
     * @param {Array.<unitModifier>} unitModifierArray
     * @returns {Array.<unitModifier>} ordered (original list also mutated in place)
     */
    static sortPriorityOrder(unitModifierArray) {
        unitModifierArray.sort((a, b) => {
            return (
                PRIORITY[a._modifier.priority] - PRIORITY[b._modifier.priority]
            );
        });
        return unitModifierArray;
    }

    /**
     * Find player's unit modifiers.
     *
     * @param {number} playerSlot
     * @param {string} withOwner - self, opponent, any
     * @returns {Array.<unitModifier>} modifiers
     */
    static getPlayerUnitModifiers(playerSlot, withOwner) {
        assert(typeof playerSlot === "number");
        assert(typeof withOwner === "string");
        assert(OWNER[withOwner]);

        _maybeInit();
        const unitModifiers = [];
        for (const obj of world.getAllObjects()) {
            const objNsid = ObjectNamespace.getNsid(obj);
            const unitModifier = _triggerNsidToUnitModifier[objNsid];
            if (!unitModifier) {
                continue;
            }

            if (obj.getContainer()) {
                continue; // inside a container
            }

            if (obj instanceof Card && !obj.isFaceUp()) {
                continue; // face down card
            }

            // Enfoce modifier type (self, opponent, any).
            if (unitModifier.raw !== "any") {
                // Not an "any", require it be of "withType".
                if (unitModifier.raw.owner !== withOwner) {
                    continue;
                }

                // Matches "withType", require it belong to player.
                let ownerSlot = obj.getOwningPlayerSlot();
                if (ownerSlot < 0) {
                    const playerDesk = PlayerDesk.getClosest(obj.getPosition());
                    ownerSlot = playerDesk.playerSlot;
                }
                if (ownerSlot !== playerSlot) {
                    continue; // different owner
                }
            }

            // Found a unit modifier!  Add it to the list.
            if (!unitModifiers.includes(unitModifier)) {
                unitModifiers.push(unitModifier);
            }
        }
        return unitModifiers;
    }

    /**
     * Get unit modifier associated with nsid.
     *
     * @param {string} nsid
     * @returns {unitModifier}
     */
    static getNsidUnitModifier(nsid) {
        assert(typeof nsid === "string");
        _maybeInit();
        return _triggerNsidToUnitModifier[nsid];
    }

    /**
     * Get faction abilility.
     *
     * @param {string} factionAbility
     * @returns {unitModifier}
     */
    static getFactionAbilityUnitModifier(factionAbility) {
        assert(typeof factionAbility === "string");
        _maybeInit();
        return _factionAbilityToUnitModifier[factionAbility];
    }

    /**
     * Get faction abililities.
     *
     * @param {string} unitAbility
     * @returns {unitModifier}
     */
    static getUnitAbilityUnitModifier(unitAbility) {
        assert(typeof unitAbility === "string");
        _maybeInit();
        return _unitAbilityToUnitModifier[unitAbility];
    }

    // ------------------------------------------------------------------------

    /**
     * Constructor.
     *
     * @param {object} modifier - UnitModifiersSchema compliant object
     */
    constructor(modifier) {
        assert(typeof modifier === "object");
        assert(UnitModifierSchema.validate(modifier));
        this._modifier = modifier;
    }

    /**
     * Localized modifier name.
     *
     * @returns {string}
     */
    get name() {
        return locale(this._modifier.localeName);
    }

    /**
     * Localized modifier description.
     *
     * @returns {string}
     */
    get desc() {
        return locale(this._modifier.localeDescription);
    }

    /**
     * Get the underlying object.
     *
     * @returns {object}
     */
    get raw() {
        return this._modifier;
    }

    /**
     * Apply unit modifier.
     *
     * @param {object} unitToUnitAttrs - mutated in place
     * @param {object} auxData - table of misc things modifiers might use
     */
    apply(unitAttrsSet, auxData) {
        if (this._modifier.applyEach) {
            for (const unitAttrs of unitAttrsSet.values()) {
                this._modifier.applyEach(unitAttrs, auxData);
            }
        }
        if (this._modifier.applyAll) {
            this._modifier.applyAll(unitAttrsSet, auxData);
        }

        // Paranoid verify modifier did not break it.
        for (const unitAttrs of unitAttrsSet.values()) {
            assert(unitAttrs.validate());
        }
    }
}

module.exports = {
    UnitModifier,
    PRIORITY,
    OWNER,
};
