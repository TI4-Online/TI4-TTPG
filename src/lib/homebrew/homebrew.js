const assert = require("../../wrapper/assert-wrapper");
const locale = require("../locale");
const { Faction } = require("../faction/faction");
const { Spawn } = require("../../setup/spawn/spawn");
const { System } = require("../system/system");
const { Technology } = require("../technology/technology");
const { UnitAttrs } = require("../unit/unit-attrs");
const { UnitModifier } = require("../unit/unit-modifier");

class Homebrew {
    constructor() {}

    validate(table) {
        // TODO XXX faction home systems, tech, units
    }

    inject(table) {
        if (table.localeStrings) {
            // "faction.abbr.<x>", "faction.full.<x>"
            for (const [key, value] of table.localeStrings) {
                assert(typeof key === "string");
                assert(typeof value === "string");
                locale.inject(key, value);
            }
        }
        if (table.factions) {
            for (const faction of table.factions) {
                Faction.injectFaction(faction);
            }
        }
        if (table.nsidToTemplateId) {
            // Faction sheet, token template, promissory, leader cards, etc.
            for (const [nsid, tempateId] of Object.entries(
                table.nsidToTemplateId
            )) {
                Spawn.injectNsidToTemplate(nsid, tempateId);
            }
        }
        if (table.systems) {
            for (const system of table.systems) {
                System.injectSystem(system);
            }
        }
        if (table.technologies) {
            for (const technology of table.technologies) {
                Technology.injectTechnology(technology);
            }
        }
        if (table.unitAttrs) {
            for (const unitAttrs of table.unitAttrs) {
                UnitAttrs.injectUnitAttrs(unitAttrs);
            }
        }
        if (table.unitModifiers) {
            for (const unitModifier of table.unitModifiers) {
                UnitModifier.injectUnitModifier(unitModifier);
            }
        }
    }
}

module.exports = { Homebrew };
