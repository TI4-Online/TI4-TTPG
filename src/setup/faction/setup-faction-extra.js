const assert = require("../../wrapper/assert-wrapper");
const { AbstractSetup } = require("../abstract-setup");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { Spawn } = require("../spawn/spawn");
const { Rotator, Vector, world } = require("../../wrapper/api");

const EXTRA_P0 = { x: 32, y: -20, z: 10 }; // start higher than leaders
const SCALE = 0.8;

class SetupFactionExtra extends AbstractSetup {
    constructor(playerDesk, faction) {
        assert(playerDesk && faction);
        super(playerDesk, faction);
    }

    setup() {
        const extra = this.faction.raw.unpackExtra;
        if (!extra || extra.length === 0) {
            return; // nothing to unpack
        }

        // Create a container for extras.
        const pos = this.playerDesk.localPositionToWorld(EXTRA_P0);
        const rot = this.playerDesk.rot;
        const box = Spawn.spawn("bag:base/generic", pos, rot);
        box.clear(); // paranoia
        box.setPrimaryColor([0.4, 0.4, 0.4]);
        box.setScale(new Vector(SCALE, SCALE, SCALE / 2));
        box.setName(`${this.faction.nameFull} Extras`);

        const above = pos.add([0, 0, 10]);
        extra.forEach((extra) => {
            if (extra.tokenNsid) {
                if (!Spawn.canSpawn(extra.tokenNsid)) {
                    console.log(
                        `SetupFactionExtra.setup: unregistered token nsid "${extra.tokenNsid}"`
                    );
                    return;
                }
                const count = extra.tokenCount || 1;
                for (let i = 0; i < count; i++) {
                    const pos = above;
                    const rot = this.playerDesk.rot;
                    const playerSlot = this.playerDesk.playerSlot;
                    const token = Spawn.spawn(extra.tokenNsid, pos, rot);
                    token.setOwningPlayerSlot(playerSlot);
                    box.addObjects([token]);
                }
            } else if (extra.cardNsid) {
                if (!Spawn.canSpawn(extra.cardNsid)) {
                    console.log(
                        `SetupFactionExtra.setup: unregistered card nsid "${extra.cardNsid}"`
                    );
                    return;
                }
                const pos = this.playerDesk.localPositionToWorld(above);
                const rot = new Rotator(0, 0, 180).compose(this.playerDesk.rot);
                const playerSlot = this.playerDesk.playerSlot;
                const card = Spawn.spawn(extra.cardNsid, pos, rot);
                card.setOwningPlayerSlot(playerSlot);
                box.addObjects([card]);
            } else {
                throw new Error("unknown faction.unpackExtra");
            }
        });
    }

    clean() {
        const extraNsids = new Set();
        const extra = this.faction.raw.unpackExtra;
        if (extra) {
            extra.forEach((extra) => {
                if (extra.tokenNsid) {
                    extraNsids.add(extra.tokenNsid);
                }
            });
        }

        const extrasBoxName = `${this.faction.nameFull} Extras`;

        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (obj.getName() !== extrasBoxName && !extraNsids.has(nsid)) {
                continue;
            }
            const pos = obj.getPosition();
            const closestDesk = world.TI4.getClosestPlayerDesk(pos);
            if (closestDesk !== this.playerDesk) {
                continue;
            }
            obj.setTags(["DELETED_ITEMS_IGNORE"]);
            obj.destroy();
        }
    }
}

module.exports = { SetupFactionExtra };
