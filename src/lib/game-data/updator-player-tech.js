const assert = require("../../wrapper/assert-wrapper");
const { CardUtil } = require("../../lib/card/card-util");
const { ObjectNamespace } = require("../object-namespace");
const { world } = require("../../wrapper/api");
const TECHNOLOGY_DATA = require("../technology/technology.data");

let _nsidToAbbr = false;

module.exports = (data) => {
    assert(data.players.length === world.TI4.config.playerCount);
    data.players.forEach((playerData) => {
        playerData.technologies = [];
    });

    const techCards = [];
    for (const obj of world.getAllObjects()) {
        if (obj.getContainer()) {
            continue;
        }
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
    if (!_nsidToAbbr) {
        _nsidToAbbr = {};
        TECHNOLOGY_DATA.forEach((techData) => {
            _nsidToAbbr[techData.cardNsid] = techData.abbrev; // warning, not localized!
        });
    }

    // Add per-player tech.
    techCards.forEach((card) => {
        const nsid = ObjectNamespace.getNsid(card);
        assert(nsid);
        const abbr = _nsidToAbbr[nsid];
        assert(abbr);
        const pos = card.getPosition();
        const playerDesk = world.TI4.getClosestPlayerDesk(pos);
        assert(playerDesk);
        const playerData = data.players[playerDesk.index];
        assert(playerData);
        assert(playerData.technologies);
        playerData.technologies.push(abbr);
    });
};
