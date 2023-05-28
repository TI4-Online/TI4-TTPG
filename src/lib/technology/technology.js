const assert = require("../../wrapper/assert-wrapper");
const locale = require("../locale");
const { Broadcast } = require("../broadcast");
const { ObjectNamespace } = require("../object-namespace");
const { CardUtil } = require("../card/card-util");
const { TechCardUtil } = require("../card/tech-card-util");
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
    static invalidateCache() {
        invalidateCache();
    }

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
        for (let i = TECHNOLOGY_DATA.length - 1; i >= 0; i--) {
            if (TECHNOLOGY_DATA[i].name === rawTechnology.name) {
                TECHNOLOGY_DATA.splice(i, 1);
            }
        }
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

    static countPlayerTechsByType(playerSlot) {
        const playerTechnologies = {
            Blue: 0,
            Red: 0,
            Yellow: 0,
            Green: 0,
        };

        Technology.getOwnedPlayerTechnologies(playerSlot)
            .filter((tech) =>
                ["Blue", "Red", "Yellow", "Green"].includes(tech.type)
            )
            .forEach((tech) => {
                playerTechnologies[tech.type]++;
            });

        return playerTechnologies;
    }

    static onTechResearched(technologyName, playerSlot, skipBroadcast) {
        const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
        const playerName = world.TI4.getNameByPlayerSlot(playerSlot);
        const msgColor = playerDesk.color;

        const technology = Technology.getTechnologies(playerSlot).find(
            (tech) => tech.name === technologyName
        );

        TechCardUtil.moveCardsToCardHolder([technology.cardNsid], playerSlot);

        if (skipBroadcast) {
            return;
        }

        if (technology.localeName == "strategy_card.technology.button.nekro") {
            let messageKey = "strategy_card.technology.message.nekro";
            let messageParameters = {
                playerName,
            };
            Broadcast.chatAll(locale(messageKey, messageParameters), msgColor);
            return;
        }

        const ownedTechnologies = Technology.countPlayerTechsByType(playerSlot);
        const skippedTechs = {};

        for (let requirement in technology.requirements) {
            const required = technology.requirements[requirement];
            const owned = ownedTechnologies[requirement];

            if (required > owned) {
                skippedTechs[requirement] = required - owned;
            }
        }

        let messageKey = "strategy_card.technology.message.researched";
        const messageParameters = {
            playerName,
            technologyName: technologyName,
            skips: "",
        };

        if (Object.keys(skippedTechs).length) {
            messageKey =
                "strategy_card.technology.message.researched_and_skips";
            for (let requirement in skippedTechs) {
                if (messageParameters.skips) {
                    messageParameters.skips += ", ";
                }

                const techType = locale(`technology.type.${requirement}`);

                messageParameters.skips += `${skippedTechs[requirement]} ${techType}`;
            }
            console.log(
                `skippedTechs: ${JSON.stringify(skippedTechs)} - skips: ${
                    messageParameters.skips
                }`
            );
        }

        Broadcast.chatAll(locale(messageKey, messageParameters), msgColor);
    }
}

module.exports = { Technology };
