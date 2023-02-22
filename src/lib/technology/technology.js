const assert = require("../../wrapper/assert-wrapper");
const locale = require("../locale");
const { ObjectNamespace } = require("../object-namespace");
const { CardUtil } = require("../card/card-util");
const TECHNOLOGY_DATA = require("./technology.data");
const { world } = require("../../wrapper/api");
const { TechnologySchema } = require("./technology.schema");

TECHNOLOGY_DATA.forEach((tech) => {
    tech.name = locale(tech.localeName);
    // TODO: translate also abbrevs (if needed; requires also text extractions from .data)
});

let _technologies;
let _technologiesByFaction = {};
let _settings = undefined; // filled by checkCache
const types = ["Red", "Yellow", "Green", "Blue", "unitUpgrade"];

const _injectedSources = new Set();

const isSourceEnabled = (source) => {
    return (
        source === undefined || // base technology
        (source === "PoK" && world.TI4.config.pok) ||
        (source === "Codex 3" && world.TI4.config.codex3) ||
        _injectedSources.has(source)
    );
};

const getTechnologiesRawArray = (factionName) => {
    return TECHNOLOGY_DATA.filter((tech) => {
        if (!isSourceEnabled(tech.source)) {
            return false;
        }
        if (!factionName) {
            return true; // no filtering for factions
        }
        if (!tech.faction && !tech.factions) {
            return true; // not a faction technology
        }
        return (
            tech.faction === factionName ||
            (tech.factions && tech.factions.includes(factionName))
        ); // matching faction
    });
};

const invalidateCache = () => {
    _technologies = undefined;
    _technologiesByFaction = {};
};

const checkCache = () => {
    const pok = world.TI4.config.pok;
    const codex3 = world.TI4.config.codex3;
    if (!_settings || _settings.pok !== pok || _settings.codex3 !== codex3) {
        invalidateCache();
    }
    _settings = { pok, codex3 };
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
    checkCache();

    if (!factionName) {
        _technologies = _technologies || getTechnologiesMap();
        return _technologies;
    }

    _technologiesByFaction[factionName] =
        _technologiesByFaction[factionName] || getTechnologiesMap(factionName);
    return _technologiesByFaction[factionName];
};

class Technology {
    static injectTechnology(rawTechnology) {
        assert(rawTechnology);
        TechnologySchema.validate(rawTechnology, (err) => {
            throw new Error(
                `Technology.injectTechnology "${JSON.stringify(
                    rawTechnology
                )}" error "${err}"`
            );
        });
        rawTechnology.name = locale(rawTechnology.localeName);
        TECHNOLOGY_DATA.push(rawTechnology);
        _injectedSources.add(rawTechnology.source);
        invalidateCache();
    }

    static getByNsidName(nsidName) {
        const localeName = `technology.name.${nsidName}`;
        for (const entry of TECHNOLOGY_DATA) {
            if (entry.localeName === localeName) {
                return entry;
            }
        }
    }

    static getOwnedPlayerTechnologies(playerSlot) {
        assert(Number.isInteger(playerSlot));

        let playerTechnologiesNsid = [];

        for (const obj of world.getAllObjects()) {
            const nsid = ObjectNamespace.getNsid(obj);
            if (!nsid.startsWith("card.technology")) {
                continue;
            }
            if (!CardUtil.isLooseCard(obj, false, true)) {
                continue; // not a lone card on the table (it may be face down!)
            }
            const ownerPlayerSlot = world.TI4.getClosestPlayerDesk(
                obj.getPosition()
            ).playerSlot;

            if (ownerPlayerSlot === playerSlot) {
                playerTechnologiesNsid.push(nsid);
            }
        }

        return TECHNOLOGY_DATA.filter((tech) => {
            return playerTechnologiesNsid.some((nsid) => {
                if (nsid === tech.cardNsid) {
                    return true;
                }
                if (tech.aliasNsids && tech.aliasNsids.includes(nsid)) {
                    return true;
                }
                return false;
            });
        });
    }

    static getTechnologies(playerSlot) {
        let factionNsidName = false;
        if (playerSlot) {
            const faction = world.TI4.getFactionByPlayerSlot(playerSlot);
            factionNsidName = faction ? faction.raw.faction : "N/A";
        }
        return getTechnologies(factionNsidName).all;
    }

    static getTechnologiesByType(playerSlot) {
        let factionNsidName = false;
        if (playerSlot) {
            const faction = world.TI4.getFactionByPlayerSlot(playerSlot);
            factionNsidName = faction ? faction.raw.faction : "N/A";
        }
        return getTechnologies(factionNsidName).byType;
    }

    static getTechnologiesOfType(type, playerSlot) {
        assert(types.includes(type));
        return Technology.getTechnologiesByType(playerSlot)[type];
    }
}

module.exports = { Technology };
