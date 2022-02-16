const assert = require("../../wrapper/assert-wrapper");
const technologyData = require("./technology.data");
const { Faction } = require("../faction/faction");
const locale = require("../locale");

technologyData.forEach((tech) => {
    tech.name = locale(tech.localeName);
    // TODO: translate also abbrevs (if needed; requires also text extractions from .data)
});

let _technologies;
let _technologiesByFaction = {};
const types = ["Red", "Yellow", "Green", "Blue", "unitUpgrade"];

const getTechnologiesRawArray = (factionName) => {
    return technologyData.filter((tech) => {
        return (
            !factionName || // no filtering for factions
            !tech.faction || // not a faction technology
            tech.faction === factionName // matching faction
        );
    });
};

const getTechnologiesMap = (factionName) => {
    let technologies = {
        all: getTechnologiesRawArray(factionName),
        byType: {},
    };

    types.forEach((type) => {
        technologies.byType[type] = technologies.all.filter((tech) => {
            return !type || tech.type === type;
        });
    });

    return technologies;
};

const getTechnologies = (factionName) => {
    if (!factionName) {
        if (!_technologies) {
            _technologies = getTechnologiesMap();
        }
        return _technologies;
    }

    assert(factionName); // a faction was identified

    if (!_technologiesByFaction[factionName]) {
        _technologiesByFaction[factionName] = getTechnologiesMap(factionName);
    }

    return _technologiesByFaction[factionName];
};

class Technology {
    static getTechnologies(playerSlot) {
        if (!playerSlot) {
            return getTechnologies().all;
        }

        const factionName = Faction.getByPlayerSlot(playerSlot).raw.faction;
        assert(factionName); // a faction was identified
        return getTechnologies(factionName).all;
    }

    static getTechnologiesByType(playerSlot) {
        if (!playerSlot) {
            return getTechnologies().byType;
        }

        const factionName = Faction.getByPlayerSlot(playerSlot).raw.faction;
        assert(factionName); // a faction was identified
        return getTechnologies(factionName).byType;
    }

    static getTechnologiesOfType(type, playerSlot) {
        assert(types.includes(type));
        return Technology.getTechnologiesByType(playerSlot)[type];
    }
}

module.exports = { Technology };
