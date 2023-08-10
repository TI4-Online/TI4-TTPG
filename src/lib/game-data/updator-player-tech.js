const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { CardUtil } = require("../../lib/card/card-util");
const { ObjectNamespace } = require("../object-namespace");
const { world } = require("../../wrapper/api");
const TECHNOLOGY_DATA = require("../technology/technology.data");

let _nsidToName = false;

module.exports = (data) => {
    assert(data.players.length === world.TI4.config.playerCount);
    data.players.forEach((playerData) => {
        playerData.technologies = [];
    });

    const techCards = [];
    const skipContained = true;
    for (const obj of world.getAllObjects(skipContained)) {
        const nsid = ObjectNamespace.getNsid(obj);
        if (!nsid.startsWith("card.technology")) {
            continue;
        }
        const checkDiscardPile = false;
        const allowFaceDown = true;
        if (!CardUtil.isLooseCard(obj, checkDiscardPile, allowFaceDown)) {
            continue;
        }

        techCards.push(obj);
    }

    // Use abbr names.
    if (!_nsidToName) {
        _nsidToName = {};
        TECHNOLOGY_DATA.forEach((techData) => {
            const name = locale(techData.localeName);
            _nsidToName[techData.cardNsid] = name;
            const aliasNsids = techData.aliasNsids || [];
            for (const aliasNsid of aliasNsids) {
                _nsidToName[aliasNsid] = name;
                if (aliasNsid.endsWith(".omega")) {
                    const stripped = aliasNsid.replace(/.omega$/, "");
                    _nsidToName[stripped] = name;
                }
            }
        });
    }

    // Add per-player tech.
    techCards.forEach((card) => {
        let nsid = ObjectNamespace.getNsid(card);
        assert(nsid);
        // Tech map does not include omega nsids (should it?).
        if (nsid.endsWith(".omega")) {
            nsid = nsid.replace(/.omega$/, "");
        }
        let name = _nsidToName[nsid];
        if (!name) {
            console.log(`unknown tech "${nsid}"`);
            const parsed = ObjectNamespace.parseNsid(nsid);
            name = parsed ? parsed.name : nsid;
        }
        const pos = card.getPosition();
        const playerDesk = world.TI4.getClosestPlayerDesk(pos);
        assert(playerDesk);
        const playerData = data.players[playerDesk.index];
        assert(playerData);
        assert(playerData.technologies);
        playerData.technologies.push(name);
    });

    // Unique.
    data.players.forEach((playerData) => {
        playerData.technologies = playerData.technologies.filter(
            (value, index, self) => {
                return self.indexOf(value) === index;
            }
        );
    });
};
