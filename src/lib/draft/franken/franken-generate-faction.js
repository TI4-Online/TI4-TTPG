const assert = require("../../../wrapper/assert-wrapper");
const { GameObject, world } = require("../../../wrapper/api");
const { ObjectNamespace } = require("../../object-namespace");
const { FactionSchema } = require("../../faction/faction.schema");
const { Faction } = require("../../faction/faction");
const { UnitAttrs } = require("../../unit/unit-attrs");

const TEST_AGAINST_SCHEMA = false;

class FrankenGenerateFaction {
    static gatherFactionDefinitions(destroyObjs) {
        assert(Array.isArray(destroyObjs));

        const factions = [];

        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            factions[playerDesk.index] = {
                faction: "",
                abilities: [],
                commodities: 0,
                home: -1,
                icon: undefined,
                leaders: {
                    agents: [],
                    commanders: [],
                    heroes: [],
                },
                promissoryNotes: [],
                source: "", // must use correct source to find tokens
                startingTech: [],
                startingUnits: {},
                techs: [],
                units: [],
                unpackExtra: [],
            };
        }

        const getFaction = (obj) => {
            assert(obj instanceof GameObject);
            const pos = obj.getPosition();
            const closestDesk = world.TI4.getClosestPlayerDesk(pos);
            const faction = factions[closestDesk.index];
            assert(faction);
            return faction;
        };

        const genericNoteColors = new Set([
            "white",
            "blue",
            "purple",
            "yellow",
            "red",
            "green",
            "pink",
            "orange",
            "brown",
        ]);
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (!nsid) {
                continue;
            }
            const parsed = ObjectNamespace.parseNsid(nsid);
            if (!parsed) {
                continue;
            }
            const parsedName = parsed.name.split(".")[0]; // remove .omega, etc
            const json =
                nsid === "tile:homebrew/name_desc"
                    ? JSON.parse(obj.getSavedData())
                    : undefined;

            if (json && json.abilities) {
                const faction = getFaction(obj);
                faction.abilities.push(...json.abilities);
                destroyObjs.push(obj);
            }

            if (json && json.commodities) {
                const faction = getFaction(obj);
                faction.commodities = json.commodities;
                destroyObjs.push(obj);
            }

            const system = world.TI4.getSystemBySystemTileObject(obj);
            if (system && system.home) {
                const faction = getFaction(obj);
                faction.home = system.tile;

                // To support "oops all X" home system tiles get an owner.
                const pos = obj.getPosition();
                const closestDesk = world.TI4.getClosestPlayerDesk(pos);
                obj.setOwningPlayerSlot(closestDesk.playerSlot);
            }

            if (nsid.startsWith("card.leader")) {
                const faction = getFaction(obj);
                const leaderType = parsed.type.split(".")[2];
                const leaderName = parsedName;
                if (leaderType === "agent") {
                    faction.leaders.agents.push(leaderName);
                } else if (leaderType === "commander") {
                    faction.leaders.commanders.push(leaderName);
                } else if (leaderType === "hero") {
                    faction.leaders.heroes.push(leaderName);
                } else if (leaderType === "mech") {
                    faction.units.push(leaderName);
                } else {
                    throw new Error(
                        `unknown leader type "${leaderType}" ("${leaderName}")`
                    );
                }
            }

            if (nsid.startsWith("card.promissory")) {
                const noteFactionNsidName = parsed.type.split(".")[2];
                if (!genericNoteColors.has(noteFactionNsidName)) {
                    const faction = getFaction(obj);
                    const noteName = parsedName;
                    const noteFaction =
                        world.TI4.getFactionByNsidName(noteFactionNsidName);
                    if (!noteFaction) {
                        throw new Error(`unknown note faction from "${nsid}"`);
                    }
                    faction.faction = noteFaction.nsidName; // use promissory note for faction id
                    faction.source = noteFaction.nsidSource;
                    faction.icon = noteFaction.icon;
                    faction.packageId = noteFaction.packageId;
                    faction.promissoryNotes.push(noteName);
                }
            }

            if (json && json.startingTech) {
                const faction = getFaction(obj);
                faction.startingTech = json.startingTech;
                destroyObjs.push(obj);
            }

            if (json && json.startingTechChoice) {
                const faction = getFaction(obj);
                faction.startingTechChoice = json.startingTechChoice;
                destroyObjs.push(obj);
            }

            if (json && json.startingUnits) {
                const faction = getFaction(obj);
                faction.startingUnits = json.startingUnits;
                destroyObjs.push(obj);
            }

            if (nsid.startsWith("card.technology")) {
                const faction = getFaction(obj);
                const techName = parsedName;
                faction.techs.push(techName);
            }

            // Flagship uses a special franken card.
            if (
                nsid.startsWith("card.technology.unit_upgrade") &&
                parsed.source.startsWith("franken")
            ) {
                const faction = getFaction(obj);
                const techName = parsedName;
                faction.units.push(techName);
            }

            // Find other level-1 units if level-2 card.  Assume any
            // unit upgrade ending with "_2" has a corresponding level
            // one without that suffix (empty, not "_1").
            if (
                nsid.startsWith("card.technology.unit_upgrade") &&
                parsedName.endsWith("_2")
            ) {
                const faction = getFaction(obj);
                const unit_2 = parsedName;
                const unit_1 = unit_2.slice(0, -2);
                faction.units.push(unit_1);
                faction.units.push(unit_2);
            }
        }

        return factions.map((factionAttrs) => {
            return new Faction(factionAttrs);
        });
    }

    static isValid(faction, errors) {
        assert(faction);
        assert(Array.isArray(errors));
        assert(errors.length === 0);

        // Manually check fields.
        if (faction.raw.faction === "") {
            errors.push("missing promissory note");
        }
        if (faction.raw.abilities.length === 0) {
            errors.push("missing abilities");
        }
        if (faction.raw.commodities === 0) {
            errors.push("missing commodities");
        }
        if (faction.raw.home === -1) {
            errors.push("missing home system");
        }
        if (world.TI4.config.pok) {
            if (faction.raw.leaders.agents.length === 0) {
                errors.push("missing agent");
            }
            if (faction.raw.leaders.commanders.length === 0) {
                errors.push("missing commander");
            }
            if (faction.raw.leaders.heroes.length === 0) {
                errors.push("missing hero");
            }
        }
        if (faction.raw.promissoryNotes.length === 0) {
            errors.push("missing promissory note");
        }
        if (
            faction.raw.startingTech.length === 0 &&
            !faction.raw.startingTechChoice
        ) {
            errors.push("missing starting tech");
        }
        if (Object.keys(faction.raw.startingUnits).length === 0) {
            errors.push("missing starting units");
        }
        if (faction.raw.techs.length === 0) {
            errors.push("missing faction tech");
        }

        let foundMech = false;
        let foundFlagship = false;
        for (const unit of faction.raw.units) {
            const unitAttrs = UnitAttrs.getNsidNameUnitUpgrade(unit);
            if (!unitAttrs) {
                console.log(`bad unit "${unit}"`);
                continue;
            }
            if (unitAttrs.unit === "mech") {
                foundMech = true;
            } else if (unitAttrs.unit === "flagship") {
                foundFlagship = true;
            }
        }
        if (!foundMech) {
            errors.push("missing mech");
        }
        if (!foundFlagship) {
            errors.push("missing flagship");
        }

        // Schema messages are not user friendly.  Trust the above is enough.
        if (TEST_AGAINST_SCHEMA) {
            const onError = (err) => {
                const msg = `Faction schema error: ${
                    err.message
                } (${JSON.stringify(err)})`;
                errors.push(msg);
            };
            FactionSchema.validate(faction, onError);
        }
        return errors.length === 0;
    }
}

module.exports = { FrankenGenerateFaction };
