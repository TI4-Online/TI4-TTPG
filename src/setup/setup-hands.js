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
        const obj = world.createObjectFromTemplate(templateId, pos);
        obj.setRotation(rot);
        obj.setOwningPlayerSlot(playerSlot);
        obj.setObjectType(ObjectType.Ground);

        // The built-in card holder does not show backs.  Leave it be.
        // We *could* edit json or make a template, but wait for a good one.
    }
}

module.exports = { SetupHands };
