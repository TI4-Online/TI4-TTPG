const assert = require("../../wrapper/assert-wrapper");
const { AbstractSetup } = require("../abstract-setup");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { Spawn } = require("../spawn/spawn");
const { Vector, world } = require("../../wrapper/api");
const { PROMISSORY_DECK_LOCAL_OFFSET } = require("../setup-generic-promissory");

const EXTRA_OFFSET = [0, 5, 0];

class SetupFactionExtra extends AbstractSetup {
    constructor(playerDesk, faction) {
        assert(playerDesk && faction);
        super(playerDesk, faction);
    }

    setup() {
        const extra = this.faction.raw.unpackExtra;
        if (!extra) {
            return; // nothing to unpack
        }
        const pos = PROMISSORY_DECK_LOCAL_OFFSET;
        let nextPos = new Vector(pos.x, pos.y, pos.z).add(EXTRA_OFFSET);
        extra.forEach((extra) => {
            if (extra.tokenNsid && extra.bagNsid) {
                extra.bagPos = nextPos;
                this.spawnTokensAndBag(extra);
                nextPos = nextPos.add(EXTRA_OFFSET);
            } else if (extra.tokenNsid) {
                const count = extra.tokenCount || 1;
                for (let i = 0; i < count; i++) {
                    const pos = this.playerDesk.localPositionToWorld(nextPos);
                    const rot = this.playerDesk.rot;
                    const playerSlot = this.playerDesk.playerSlot;
                    const token = Spawn.spawn(extra.tokenNsid, pos, rot);
                    token.setOwningPlayerSlot(playerSlot);
                    nextPos = nextPos.add(EXTRA_OFFSET);
                }
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
                if (extra.bagNsid) {
                    extraNsids.add(extra.bagNsid);
                }
            });
        }

        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (!extraNsids.has(nsid)) {
                continue;
            }
            const pos = obj.getPosition();
            const closestDesk = world.TI4.getClosestPlayerDesk(pos);
            if (closestDesk !== this.playerDesk) {
                continue;
            }
            obj.destroy();
        }
    }
}

module.exports = { SetupFactionExtra };
