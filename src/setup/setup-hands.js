const { AbstractSetup } = require("./abstract-setup");
const { ObjectType, world } = require("../wrapper/api");

const HAND_LOCAL_OFFSET = {
    x: -29.7,
    y: -6,
    z: 5,
};

class SetupHands extends AbstractSetup {
    constructor(playerDesk) {
        super();
        this.setPlayerDesk(playerDesk);
    }

    setup() {
        const pos = this.playerDesk.localPositionToWorld(HAND_LOCAL_OFFSET);
        const rot = this.playerDesk.rot;
        const playerSlot = this.playerDesk.playerSlot;

        // For now use the TTPG wide hand.
        // Swap for custom model when available.
        const templateId = "A12757C14B19B37232C9FCAC9B04CEA7";
        let obj = world.createObjectFromTemplate(templateId, pos);

        // Set "show backs" for how to hide cards.
        // TODO XXX TTPG DOES NOT YET SUPPORT THIS VIA SCRIPT.
        // REPLACE THIS SICKNESS WITH obj.setShowCardBacks(true) WHEN ABLE!
        // LIKEWISE IF A BETTER TEMPLATE EXISTS IT MAY BE ABLE TO APPLY THIS.
        let json = obj.toJSONString();
        json = json.replace('"showCardBacks":false', '"showCardBacks":true');
        obj.destroy();
        obj = world.createObjectFromJSON(json, pos);

        obj.setRotation(rot);
        obj.setOwningPlayerSlot(playerSlot);
        obj.setObjectType(ObjectType.Ground);
    }
}

module.exports = { SetupHands };
