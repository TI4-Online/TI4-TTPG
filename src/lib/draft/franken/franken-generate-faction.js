const assert = require("../../../wrapper/assert-wrapper");
const { GameObject, world } = require("../../../wrapper/api");
const { ObjectNamespace } = require("../../object-namespace");
const { FactionSchema } = require("../../faction/faction.schema");
const { Faction } = require("../../faction/faction");

class FrankenGenerateFaction {
    static gatherFactionDefinitions() {
        const factions = [];
        const destroyObjs = [];

        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            factions[playerDesk.index] = {
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
                source: "franken",
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

        for (const obj of destroyObjs) {
            obj.setTags(["DELETED_ITEMS_IGNORE"]);
            obj.destroy();
        }

        return factions.map((factionAttrs) => {
            return new Faction(factionAttrs);
        });
    }

    static isValid(faction, playerSlot, errors) {
        assert(faction);
        assert(Array.isArray(errors));

        let result = true;

        const onError = (err) => {
            result = false;
            const playerName = world.TI4.getNameByPlayerSlot(playerSlot);
            const msg = `Faction error for ${playerName}: ${
                err.message
            } (${JSON.stringify(err)})`;
            errors.push(msg);
        };
        FactionSchema.validate(faction, onError);
        return result;
    }
}

module.exports = { FrankenGenerateFaction };
