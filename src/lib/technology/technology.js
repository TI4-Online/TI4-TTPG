const assert = require("../../wrapper/assert-wrapper");
const locale = require("../locale");
const { ObjectNamespace } = require("../object-namespace");
const { CardUtil } = require("../card/card-util");
const { Faction } = require("../faction/faction");
const TECHNOLOGY_DATA = require("./technology.data");
const { world } = require("../../wrapper/api");

TECHNOLOGY_DATA.forEach((tech) => {
    tech.name = locale(tech.localeName);
    // TODO: translate also abbrevs (if needed; requires also text extractions from .data)
});

let _technologies;
let _technologiesByFaction = {};
let _settings = {
    pok: world.TI4.config.pok,
};
const types = ["Red", "Yellow", "Green", "Blue", "unitUpgrade"];

const isSourceEnabled = (source) => {
    return (
        source === undefined || // base technology
        (source === "PoK" && world.TI4.config.pok)
    ); // PoK technology
};

const getTechnologiesRawArray = (factionName) => {
    return TECHNOLOGY_DATA.filter((tech) => {
        return (
            isSourceEnabled(tech.source) &&
            (!factionName || // no filtering for factions
                !tech.faction || // not a faction technology
                tech.faction === factionName) // matching faction
        );
    });
};

const checkCache = () => {
    const pok = world.TI4.config.pok;
    if (_settings.pok !== pok) {
        _technologies = undefined;
        _technologiesByFaction = {};
    }
    _settings.pok = pok;
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
    static getOwnedPlayerTechnologies(playerSlot) {
        assert(Number.isInteger(playerSlot));

        let playerTechnologiesNsid = [];

        for (const obj of world.getAllObjects()) {
            const nsid = ObjectNamespace.getNsid(obj);
            if (!nsid.startsWith("card.technology")) {
                continue;
            }
            if (!CardUtil.isLooseCard(obj, false)) {
                continue; // not a lone, faceup card on the table
            }
            const ownerPlayerSlot = world.TI4.getClosestPlayerDesk(
                obj.getPosition()
            ).playerSlot;

            if (ownerPlayerSlot === playerSlot) {
                playerTechnologiesNsid.push(nsid);
            }
        }

        return TECHNOLOGY_DATA.filter((tech) => {
            return playerTechnologiesNsid.some((nsid) =>
                // startsWith is used to support omega cards
                nsid.startsWith(tech.cardNsid)
            );
        });
    }

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
