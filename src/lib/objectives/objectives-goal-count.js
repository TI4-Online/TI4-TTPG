const assert = require("../../wrapper/assert-wrapper");
const { Borders, AREA } = require("../borders/borders");
const { ObjectivesUtil } = require("./objectives-util");
const { world } = require("../../wrapper/api");

const SKIP_CONTAINED = true;

class ObjectivesGoalCount {
    constructor() {
        throw new Error("static only");
    }

    /**
     * Return a desk-indexed array of secondary planet areas, the planets
     * controlled by that player.
     *
     * @returns {Array.{Array.{Object.{hex:string,obj:GameObject,planet:Planet}}}}
     */
    static _getControlledPlanets() {
        const result = ObjectivesUtil.initialValues([]);

        // Get one control entry per planet, remove any with conflicting control.
        const planetLocaleNameToPlayerSlots = {};
        const controlEntries = Borders.getAllControlEntries()
            .filter((controlEntry) => {
                return controlEntry.areaType === AREA.PLANET;
            })
            .map((controlEntry) => {
                const planetLocaleName = controlEntry.planet.localeName;
                const playerSlot = controlEntry.playerSlot;
                if (!planetLocaleNameToPlayerSlots[planetLocaleName]) {
                    planetLocaleNameToPlayerSlots[planetLocaleName] = new Set();
                }
                planetLocaleNameToPlayerSlots[planetLocaleName].add(playerSlot);
                return controlEntry;
            })
            .filter((controlEntry) => {
                const planetLocaleName = controlEntry.planet.localeName;
                const numOwners =
                    planetLocaleNameToPlayerSlots[planetLocaleName].size;
                planetLocaleNameToPlayerSlots[planetLocaleName].add(
                    "add_to_size_to_be_too_big"
                ); // only pass along the first match per planet
                return numOwners === 1;
            });

        // Make per-desk-index planet lists.
        controlEntries.map((controlEntry) => {
            const hex = controlEntry.hex;
            const obj = controlEntry.obj;
            const planet = controlEntry.planet;
            assert(hex);
            assert(obj);
            assert(planet);

            const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(
                controlEntry.playerSlot
            );
            const idx = playerDesk.index;

            result[idx].push({
                hex,
                obj,
                planet,
            });
        });

        return result;
    }

    /**
     * Count per-desk number of flagships and war suns.
     *
     * @returns {Array.{number}}
     */
    static countFlagshipsAndWarSuns() {
        const values = ObjectivesUtil.initialValues(0);
        for (const obj of world.getAllObjects(SKIP_CONTAINED)) {
            if (
                ObjectivesUtil.isFlagshipOrWarSun(obj) &&
                ObjectivesUtil.getHexIfUnitIsInSystem(obj)
            ) {
                const idx = ObjectivesUtil.getDeskIndexOwning(obj);
                if (idx >= 0) {
                    values[idx] += 1;
                }
            }
        }
        return values;
    }

    /**
     * Count per-desk planet influence, planet resources, and tradegoods (not commodities).
     *
     * @returns {Array.{Object.{inf:number,res:number,tgs:number}}}
     */
    static countInfResTgs() {
        const values = ObjectivesUtil.initialValues({ inf: 0, res: 0, tgs: 0 });
        for (const obj of world.getAllObjects(SKIP_CONTAINED)) {
            const inf = ObjectivesUtil.getPlanetInfluence(obj);
            const res = ObjectivesUtil.getPlanetResources(obj);
            const tgs = ObjectivesUtil.getTradeGoods(obj);
            if (inf || res || tgs) {
                const idx = ObjectivesUtil.getDeskIndexClosest(obj);
                values[idx].inf += inf;
                values[idx].res += res;
                values[idx].tgs += tgs;
            }
        }
        return values;
    }

    /**
     * Count per-desk number of non-home planets.
     *
     * @returns {Array.{number}}
     */
    static countPlanetsNonHome() {
        const values = ObjectivesUtil.initialValues(0);
        for (const obj of world.getAllObjects(SKIP_CONTAINED)) {
            const isNonHome = ObjectivesUtil.isNonHomePlanetCard(obj);
            if (isNonHome) {
                const idx = ObjectivesUtil.getDeskIndexClosest(obj);
                values[idx] += 1;
            }
        }
        return values;
    }

    /**
     * Count per-desk number of planets with each trait (planet may count for multiple).
     *
     * @returns {Array.{Object.{cultural:number,industrial:0,hazardous:number}}}
     */
    static countPlanetTraits() {
        const values = ObjectivesUtil.initialValues({
            cultural: 0,
            industrial: 0,
            hazardous: 0,
        });
        for (const obj of world.getAllObjects(SKIP_CONTAINED)) {
            const traits = ObjectivesUtil.getPlanetTraits(obj);
            if (traits) {
                const idx = ObjectivesUtil.getDeskIndexClosest(obj);
                for (const trait of traits) {
                    assert(values[idx][trait] !== undefined);
                    values[idx][trait] += 1;
                }
            }
        }
        return values;
    }

    /**
     * Count per-desk number of planets with attachments.
     *
     * @returns {Array.{number}}
     */
    static countPlanetsWithAttachments() {
        const values = ObjectivesUtil.initialValues(0);
        for (const obj of world.getAllObjects(SKIP_CONTAINED)) {
            const count = ObjectivesUtil.getPlanetAttachmentCount(obj);
            if (count) {
                const idx = ObjectivesUtil.getDeskIndexClosest(obj);
                values[idx] += 1;
            }
        }
        return values;
    }

    static countPlanetsWithStructuresOutsidePlayersHome() {
        const values = ObjectivesUtil.initialValues([]);
        for (const obj of world.getAllObjects(SKIP_CONTAINED)) {
            if (!ObjectivesUtil.isStructure(obj)) {
                continue; // not structure
            }
            const hex = ObjectivesUtil.getHexIfUnitIsInSystem(obj);
            if (!hex) {
                continue; // structure not in a system
            }
            const outsideHome = ObjectivesUtil.getHexIfUnitIsOutsideHome(obj);
            if (!outsideHome) {
                continue; // strucure is in owner's home system
            }
            const idx = ObjectivesUtil.getDeskIndexOwning(obj);
            if (idx < 0) {
                continue; // anonymous unit
            }
            const hexes = values[idx];
            if (hexes.includes(hex)) {
                continue; // already recorded
            }
            hexes.push(hex);
        }
        return values.map((hexes) => hexes.length);
    }

    /**
     * Count per-desk number of planets with tech specialties.
     *
     * @returns {Array.{number}}
     */
    static countPlanetsWithTechSpecialties() {
        const values = ObjectivesUtil.initialValues(0);
        for (const obj of world.getAllObjects(SKIP_CONTAINED)) {
            const count = ObjectivesUtil.getPlanetTechSpecialties(obj);
            if (count) {
                const idx = ObjectivesUtil.getDeskIndexClosest(obj);
                values[idx] += 1;
            }
        }
        return values;
    }

    /**
     * Count per-desk structure count.
     *
     * @returns {Array.{number}}
     */
    static countStructures() {
        const values = ObjectivesUtil.initialValues(0);
        for (const obj of world.getAllObjects(SKIP_CONTAINED)) {
            if (
                ObjectivesUtil.isStructure(obj) &&
                ObjectivesUtil.getHexIfUnitIsInSystem(obj)
            ) {
                const idx = ObjectivesUtil.getDeskIndexOwning(obj);
                if (idx >= 0) {
                    values[idx] += 1;
                }
            }
        }
        return values;
    }

    /**
     * Count per-desk number of systems without planets but have at least one unit.
     *
     * @returns {Array.{number}}
     */
    static countSystemsWithoutPlanetsWithUnits() {
        const values = ObjectivesUtil.initialValues([]);
        for (const obj of world.getAllObjects(SKIP_CONTAINED)) {
            if (!ObjectivesUtil.isUnit(obj)) {
                continue; // not a unit
            }
            const hex = ObjectivesUtil.getHexIfUnitIsInZeroPlanetSystem(obj);
            if (!hex) {
                continue; // unit either not in a system, or in a with-planet system
            }
            const idx = ObjectivesUtil.getDeskIndexOwning(obj);
            if (idx < 0) {
                continue; // anonymous unit
            }
            const hexes = values[idx];
            if (hexes.includes(hex)) {
                continue; // this hex already in the result
            }
            hexes.push(hex);
        }
        return values.map((hexes) => hexes.length);
    }

    /**
     * Count per-desk number of systems without ships adjacent to Mecatol.
     *
     * @returns {Array.{number}}
     */
    static countSystemsWithShipsAdjToMecatol() {
        const values = ObjectivesUtil.initialValues([]);
        for (const obj of world.getAllObjects(SKIP_CONTAINED)) {
            if (!ObjectivesUtil.isShip(obj)) {
                continue; // not a ship
            }
            const hex = ObjectivesUtil.getHexIfUnitIsAdjacentToMecatol(obj);
            if (!hex) {
                continue; // not adj to mecatol
            }
            const idx = ObjectivesUtil.getDeskIndexOwning(obj);
            if (idx < 0) {
                continue; // anonymous unit
            }
            const hexes = values[idx];
            if (hexes.includes(hex)) {
                continue; // this hex already in the result
            }
            hexes.push(hex);
        }
        return values.map((hexes) => hexes.length);
    }

    /**
     * Count per-desk number of technoogies with each color.
     *
     * @returns {Array.{Object.{blue:number,green:0,red:number,yellow:number}}}
     */
    static countTechnologyColors() {
        const values = ObjectivesUtil.initialValues({
            blue: 0,
            green: 0,
            red: 0,
            yellow: 0,
        });
        for (const obj of world.getAllObjects(SKIP_CONTAINED)) {
            const color = ObjectivesUtil.getTechnologyCardColor(obj);
            if (color) {
                const idx = ObjectivesUtil.getDeskIndexClosest(obj);
                assert(values[idx][color] !== undefined);
                values[idx][color] += 1;
            }
        }
        return values;
    }

    /**
     * Count per-desk number of unit upgrade technologies.
     *
     * @returns {Array.{number}}
     */
    static countUnitUpgradeTechnologies() {
        const values = ObjectivesUtil.initialValues(0);
        for (const obj of world.getAllObjects(SKIP_CONTAINED)) {
            if (ObjectivesUtil.isUnitUpgradeTechnology(obj)) {
                const idx = ObjectivesUtil.getDeskIndexClosest(obj);
                values[idx] += 1;
            }
        }
        return values;
    }
}

module.exports = { ObjectivesGoalCount };
