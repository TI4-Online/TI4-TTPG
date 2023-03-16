const assert = require("../../wrapper/assert-wrapper");
const locale = require("../locale");
const { Attachment } = require("../../objects/attachments/attachment");
const { Faction } = require("../faction/faction");
const { Franken } = require("../draft/franken/franken");
const { ReplaceObjects } = require("../../setup/spawn/replace-objects");
const { RestrictObjects } = require("../../setup/spawn/restrict-objects");
const { SetupGenericTech } = require("../../setup/setup-generic-tech");
const { SetupStrategyCards } = require("../../setup/setup-strategy-cards");
const { SetupTableDecks } = require("../../setup/setup-table-decks");
const { Spawn } = require("../../setup/spawn/spawn");
const { System } = require("../system/system");
const { Technology } = require("../technology/technology");
const { UnitAttrs } = require("../unit/unit-attrs");
const { UnitModifier } = require("../unit/unit-modifier");
const { world } = require("../../wrapper/api");

class Homebrew {
    constructor() {}

    validate(table) {
        // TODO XXX faction home systems, tech, units
    }

    inject(table) {
        if (table.localeStrings) {
            // "faction.abbr.<x>", "faction.full.<x>"
            for (const [key, value] of Object.entries(table.localeStrings)) {
                assert(typeof key === "string");
                assert(typeof value === "string");
                locale.inject(key, value);
            }
        }
        if (table.factionAbilities) {
            for (const ability of table.factionAbilities) {
                Franken.injectFactionAbility(ability);
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
        if (table.remove) {
            for (const nsid of table.remove) {
                RestrictObjects.injectRestrictNsid(nsid);
            }
        }
        if (table.replace) {
            for (const [removeNSID, useNSID] of Object.entries(table.replace)) {
                ReplaceObjects.injectReplace(removeNSID, useNSID);
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
        if (table.attachments) {
            for (const attachment of table.attachments) {
                Attachment.injectAttachment(attachment);
            }
        }
    }

    /**
     * Delete and respawn decks.
     *
     * If homebrew messes with the generic tech, agenda, action, etc decks the
     * ones on the table need to be recreated.
     */
    resetOnTableDecks() {
        console.log("Homebrew.resetOnTableDecks");
        const setupTableDecks = new SetupTableDecks();
        setupTableDecks.clean();
        setupTableDecks.setup();
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            const setupGenericTech = new SetupGenericTech(playerDesk);
            setupGenericTech.clean();
            setupGenericTech.setup();
        }
    }

    resetStrategyCards() {
        console.log("Homebrew.resetStrategyCards");
        const setupStrategyCards = new SetupStrategyCards();
        setupStrategyCards.clean();
        setupStrategyCards.setup();
    }
}

module.exports = { Homebrew };
