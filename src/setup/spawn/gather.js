const assert = require("../../wrapper/assert");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { UnitAttrs } = require("../../lib/unit/unit-attrs");
const { Card, Container, world } = require("../../wrapper/api");

/**
 * After spawning objects, gather together those for a generic player setup.
 */
class GatherGenericPlayer {
    static isGenericTechCardNsid(nsid) {
        const parsedNsid = ObjectNamespace.parseNsid(nsid);
        if (!parsedNsid) {
            return false; // does not have an NSID
        }
        if (!parsedNsid.type.startsWith("card.technology")) {
            return false; // not a technology card
        }
        const parts = parsedNsid.type.split(".");
        if (parts.length > 3) {
            return false;
        }
        return true;
    }

    /**
     * Get non-faction technology cards as a deck.
     *
     * @returns {Card} stack
     */
    static gatherTechnologyCards() {
        const result = [];

        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }

            // Look for singleton cards.
            if (obj instanceof Card && obj.getStackSize() == 1) {
                const nsid = ObjectNamespace.getNsid(obj);
                if (this.isGenericTechCardNsid(nsid)) {
                    result.push(obj);
                }
            }

            // Look inside decks.
            if (obj instanceof Card && obj.getStackSize() > 1) {
                const nsids = ObjectNamespace.getDeckNsids(obj);
                for (let i = nsids.length - 1; i >= 0; i--) {
                    const nsid = nsids[i];
                    if (this.isGenericTechCardNsid(nsid)) {
                        let cardObj;
                        if (obj.getStackSize() > 1) {
                            cardObj = obj.takeCards(1, true, i);
                        } else {
                            cardObj = obj;
                        }
                        assert(cardObj);
                        result.push(cardObj);
                    }
                }
            }
        }
        return result;
    }

    static gatherUnitsAndBags() {
        const allUnits = UnitAttrs.getAllUnitTypes();
        const unitToObj = {};
        const unitToBag = {};

        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            if (ObjectNamespace.isUnit(obj)) {
                const unit = ObjectNamespace.parseUnit(obj).unit;
                assert(!(obj instanceof Container));
                assert(allUnits.includes(unit));
                assert(!unitToObj[unit]);
                unitToObj[unit] = obj;
            }
            if (ObjectNamespace.isUnitBag(obj)) {
                const unit = ObjectNamespace.parseUnitBag(obj).unit;
                assert(obj instanceof Container);
                assert(allUnits.includes(unit));
                assert(!unitToBag[unit]);
                unitToBag[unit] = obj;
            }
        }

        // Flat list of mixed types.
        const result = [];
        for (const unit of allUnits) {
            const obj = unitToObj[unit];
            const bag = unitToBag[unit];
            assert(obj && bag);
            result.push(obj, bag);
        }

        return result;
    }

    static gatherTokenSupplyContainers() {
        const lookFor = new Set([
            "bag.token:base/fighter_1",
            "bag.token:base/fighter_3",
            "bag.token:base/infantry_1",
            "bag.token:base/infantry_3",
            "bag.token:base/tradegood_commodity_1",
            "bag.token:base/tradegood_commodity_3",
        ]);

        const result = [];
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (lookFor.has(nsid)) {
                result.push(obj);
            }
        }
        return result;
    }

    static gatherSheets() {
        const lookFor = new Set(["sheet:base/command", "sheet:pok/leader"]);

        const result = [];
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (lookFor.has(nsid)) {
                result.push(obj);
            }
        }
        return result;
    }

    static gatherFactionComponents() {}
}

module.exports = { GatherGenericPlayer };
