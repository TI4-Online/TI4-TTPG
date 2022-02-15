const { AbstractSetup } = require("./abstract-setup");
const { CardUtil } = require("../lib/card/card-util");
const { ObjectType, world } = require("../wrapper/api");

const HAND_LOCAL_OFFSET = {
    x: -29.7,
    y: -6,
    z: 5,
};

class SetupHands extends AbstractSetup {
    constructor(playerDesk) {
        super(playerDesk);
    }

    setup() {
        const pos = this.playerDesk.localPositionToWorld(HAND_LOCAL_OFFSET);
        const rot = this.playerDesk.rot;
        const playerSlot = this.playerDesk.playerSlot;

        // For now use the TTPG wide hand.
        // Swap for custom model when available.
        const templateId = "A12757C14B19B37232C9FCAC9B04CEA7";
        let obj = world.createObjectFromTemplate(templateId, pos);

        // TTPG does not provide script methods to edit these attributes, nor
        // are all avaialble in the template editor (that I can see).
        // REPLACE THIS SICKNESS WITH obj.setX() WHEN ABLE!
        const json = JSON.parse(obj.toJSONString());
        json.showCardBacks = true;
        json.MaxCards = 100;
        obj.destroy();
        obj = world.createObjectFromJSON(JSON.stringify(json), pos);

        obj.setRotation(rot);
        obj.setOwningPlayerSlot(playerSlot);
        obj.setObjectType(ObjectType.Ground);
    }

    clean() {
        const playerSlot = this.playerDesk.playerSlot;
        const cardHolder = CardUtil.getCardHolder(playerSlot);
        if (cardHolder) {
            cardHolder.destroy();
        }
    }
}

module.exports = { SetupHands };
