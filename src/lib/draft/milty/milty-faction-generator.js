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

    setCount(value) {
        assert(typeof value === "number");
        assert(value >= MiltyFactionGenerator.minCount);
        assert(value <= MiltyFactionGenerator.maxCount);
        this._count = value;
        return this;
    }

    generate() {
        let factions = world.TI4.getAllFactions().filter((faction) => {
            return !faction.raw.abstract;
        });
        factions = Shuffle.shuffle(factions);

        const rejectSet = new Set();

        // Only consider one Keleres, random for fair position in shuffled.
        switch (Math.floor(Math.random() * 3)) {
            case 0:
                rejectSet.add("keleres_mentak");
                rejectSet.add("keleres_xxcha");
                break;
            case 1:
                rejectSet.add("keleres_argent");
                rejectSet.add("keleres_xxcha");
                break;
            case 2:
                rejectSet.add("keleres_argent");
                rejectSet.add("keleres_mentak");
                break;
        }

        // Do not mix Keleres with conflicting faction
        factions = factions.filter((faction) => {
            const nsidName = faction.nsidName;
            if (rejectSet.has(nsidName)) {
                return false;
            }
            if (nsidName === "argent") {
                rejectSet.add("keleres_argent");
            } else if (nsidName === "mentak") {
                rejectSet.add("keleres_mentak");
            } else if (nsidName === "xxcha") {
                rejectSet.add("keleres_xxcha");
            } else if (nsidName === "keleres_argent") {
                rejectSet.add("keleres_mentak");
                rejectSet.add("keleres_xxcha");
                rejectSet.add("argent");
            } else if (nsidName === "keleres_mentak") {
                rejectSet.add("keleres_argent");
                rejectSet.add("keleres_xxcha");
                rejectSet.add("mentak");
            } else if (nsidName === "keleres_xxcha") {
                rejectSet.add("keleres_argent");
                rejectSet.add("keleres_mentak");
                rejectSet.add("xxcha");
            }
            return true;
        });

        return factions.slice(0, this._count);
    }
}

module.exports = { MiltyFactionGenerator };
