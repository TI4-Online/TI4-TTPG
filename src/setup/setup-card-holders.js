const assert = require("../wrapper/assert-wrapper");
const { AbstractSetup } = require("./abstract-setup");
const { CardUtil } = require("../lib/card/card-util");
const { Spawn } = require("./spawn/spawn");
const { HiddenCardsType, ObjectType } = require("../wrapper/api");

const HAND_LOCAL_OFFSET = {
    x: -29.7,
    y: 0,
    z: 5,
};

class SetupCardHolders extends AbstractSetup {
    constructor(playerDesk) {
        assert(playerDesk);
        super(playerDesk);
    }

    setup() {
        const pos = this.playerDesk.localPositionToWorld(HAND_LOCAL_OFFSET);
        const rot = this.playerDesk.rot;
        const playerSlot = this.playerDesk.playerSlot;

        const nsid = "cardholder:base/large";
        const obj = Spawn.spawn(nsid, pos, rot);
        obj.setHiddenCardsType(HiddenCardsType.Back);
        obj.setOwningPlayerSlot(playerSlot);
        obj.setObjectType(ObjectType.Ground);
    }
    q;
    clean() {
        const playerSlot = this.playerDesk.playerSlot;
        const cardHolder = CardUtil.getCardHolder(playerSlot);
        if (cardHolder) {
            cardHolder.destroy();
        }
    }
}

module.exports = { SetupCardHolders };
