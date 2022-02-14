const assert = require("../wrapper/assert-wrapper");
const { CardUtil } = require("../lib/card/card-util");
const { ObjectNamespace } = require("../lib/object-namespace");
const { PlayerDesk } = require("../lib/player-desk");

class CleanGenericPromissory {
    constructor(playerDesk) {
        assert(playerDesk instanceof PlayerDesk);
        this._playerDesk = playerDesk;
    }

    clean() {
        const filter = (nsid, cardOrDeck) => {
            // "card.promissory.blue" (careful about "card.promissory.jolnar").
            if (!nsid.startsWith("card.promissory")) {
                return false;
            }
            const parsed = ObjectNamespace.parseNsid(nsid);
            const colorName = parsed.type.split(".")[2];
            return colorName === this._playerDesk.colorName;
        };
        const cards = CardUtil.gatherCards(filter);
        for (const card of cards) {
            card.destroy();
        }
    }
}

module.exports = { CleanGenericPromissory };
