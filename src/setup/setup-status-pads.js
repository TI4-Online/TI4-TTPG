const assert = require("../wrapper/assert-wrapper");
const { AbstractSetup } = require("./abstract-setup");
const { Spawn } = require("./spawn/spawn");
const { ObjectType, Rotator, world } = require("../wrapper/api");
const { ObjectNamespace } = require("../lib/object-namespace");

const STATUS_PAD = {
    nsid: "pad:base/status",
    pos: { x: 18, y: 36, z: 0 },
    yaw: 180,
};

class SetupStatusPads extends AbstractSetup {
    constructor(playerDesk) {
        assert(playerDesk);
        super(playerDesk);
    }

    setup() {
        const nsid = STATUS_PAD.nsid;
        const pos = this.playerDesk.localPositionToWorld(STATUS_PAD.pos);
        const rot = new Rotator(0, STATUS_PAD.yaw, 0).compose(
            this.playerDesk.rot
        );
        const playerSlot = this.playerDesk.playerSlot;

        const obj = Spawn.spawn(nsid, pos, rot);
        obj.setOwningPlayerSlot(playerSlot);
        obj.setObjectType(ObjectType.Ground);
    }

    clean() {
        const playerSlot = this.playerDesk.playerSlot;
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            if (obj.getOwningPlayerSlot() !== playerSlot) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid !== STATUS_PAD.nsid) {
                continue;
            }
            obj.destroy();
        }
    }
}

module.exports = { SetupStatusPads };
