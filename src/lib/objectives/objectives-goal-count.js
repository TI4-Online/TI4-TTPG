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

    static countPlanetTraits() {
        const values = ObjectivesUtil.initialValues({
            cultural: 0,
            industrial: 0,
            hazardous: 0,
        });

        // XXX TODO

        return values;
    }

    static countStructures() {
        const values = ObjectivesUtil.initialValues(0);
        for (const obj of world.getAllObjects(SKIP_CONTAINED)) {
            if (
                ObjectivesUtil.isStructure(obj) &&
                ObjectivesUtil.getHexIfUnitIsInSystem(obj)
            ) {
                const idx = ObjectivesUtil.getDeskIndexOwning(obj);
                values[idx] += 1;
            }
        }
        return values;
    }
}

module.exports = { ObjectivesGoalCount };
