const { AbstractSetup } = require("./abstract-setup");

const PROMISSORY_DECK_LOCAL_OFFSET = { x: 11, y: -16, z: 7 };

class SetupGenericPromissory extends AbstractSetup {
    constructor(playerDesk) {
        super();
        this.setPlayerDesk(playerDesk);
    }

    setup() {
        const pos = this.playerDesk.localPositionToWorld(
            PROMISSORY_DECK_LOCAL_OFFSET
        );
        const rot = this.playerDesk.rot;

        const nsidPrefix = "card.promissory";
        this.spawnDecksThenFilter(pos, rot, nsidPrefix, (nsid) => {
            // "card.promissory.blue" (careful about "card.promissory.jolnar").
            const colorName = this.parseNsidGetTypePart(nsid, nsidPrefix, 2);
            return colorName === this.playerDesk.colorName;
        });
    }
}

module.exports = { SetupGenericPromissory, PROMISSORY_DECK_LOCAL_OFFSET };
