const assert = require("../../../wrapper/assert-wrapper");
const { Shuffle } = require("../../../lib/shuffle");
const { world } = require("../../../wrapper/api");

// Wrap in a static class like other modules.
class MiltyFactionGenerator {
    static get maxCount() {
        return 12;
    }

    static get minCount() {
        return world.TI4.config.playerCount;
    }

    static get defaultCount() {
        let value = world.TI4.config.playerCount + 3;
        value = Math.max(value, MiltyFactionGenerator.minCount);
        value = Math.min(value, MiltyFactionGenerator.maxCount);
        return value;
    }

    constructor() {
        this.reset();
    }

    reset() {
        this._count = MiltyFactionGenerator.defaultCount;
    }

    getCount() {
        return this._count;
    }

    setCount(value, overrideChecks) {
        assert(typeof value === "number");
        if (!overrideChecks) {
            // Some consumers might want counts outside the standard range
            assert(value >= MiltyFactionGenerator.minCount);
            assert(value <= MiltyFactionGenerator.maxCount);
        }
        this._count = value;
        return this;
    }

    generate() {
        // Get available factions.
        const nsidNameToFaction = {};
        let nsidNames = [];
        world.TI4.getAllFactions().forEach((faction) => {
            const nsidName = faction.nsidName;
            nsidNameToFaction[nsidName] = faction;
            nsidNames.push(nsidName);
        });

        let keleresFlavors = [
            "keleres_argent",
            "keleres_mentak",
            "keleres_xxcha",
        ];

        // Remove the specific Keleres flavors.  If present, inject a generic
        // one for selection purposes.  (Might not be present if not using Codex 3.)
        let haveKeleres = false;
        nsidNames = nsidNames.filter((nsidName) => {
            const isKeleres = keleresFlavors.includes(nsidName);
            haveKeleres = haveKeleres || isKeleres;
            return !isKeleres;
        });
        if (haveKeleres) {
            nsidNames.push("keleres");
        }

        nsidNames = Shuffle.shuffle(nsidNames);

        // Do not mix Keleres with conflicting faction
        const rejectSet = new Set();
        let chosenKeleres = undefined;
        nsidNames = nsidNames
            .filter((nsidName) => {
                if (rejectSet.has(nsidName)) {
                    return false;
                }

                // When encountering a Keleres flavor remove it from the set.
                if (nsidName === "argent") {
                    keleresFlavors = keleresFlavors.filter((nsidName) => {
                        return nsidName !== "keleres_argent";
                    });
                } else if (nsidName === "mentak") {
                    keleresFlavors = keleresFlavors.filter((nsidName) => {
                        return nsidName !== "keleres_mentak";
                    });
                } else if (nsidName === "xxcha") {
                    keleresFlavors = keleresFlavors.filter((nsidName) => {
                        return nsidName !== "keleres_xxcha";
                    });
                }

                // On Keleres choose an available flavor.
                if (nsidName === "keleres") {
                    assert(!chosenKeleres);
                    if (keleresFlavors.length === 0) {
                        return false; // all base factions already picked
                    }
                    chosenKeleres = Shuffle.shuffle(keleresFlavors)[0];
                    assert(chosenKeleres);
                    if (chosenKeleres === "keleres_argent") {
                        rejectSet.add("argent");
                    } else if (chosenKeleres === "keleres_mentak") {
                        rejectSet.add("mentak");
                    } else if (chosenKeleres === "keleres_xxcha") {
                        rejectSet.add("xxcha");
                    }
                }
                return true;
            })
            .map((nsidName) => {
                return nsidName === "keleres" ? chosenKeleres : nsidName;
            });

        assert(nsidNames.length >= this._count);
        nsidNames = nsidNames.slice(0, this._count);

        const factions = nsidNames.map((nsidName) => {
            const faction = nsidNameToFaction[nsidName];
            if (!faction) {
                throw new Error(`bad faction "${nsidName}"`);
            }
            return faction;
        });

        return factions;
    }
}

module.exports = { MiltyFactionGenerator };
