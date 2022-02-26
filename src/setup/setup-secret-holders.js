console.log(require("ajv"));
const assert = require("../wrapper/assert-wrapper");
const { AbstractSetup } = require("./abstract-setup");
const { ObjectNamespace } = require("../lib/object-namespace");
const { Spawn } = require("./spawn/spawn");
const {
    CardHolder,
    HiddenCardsType,
    Rotator,
    Vector,
    globalEvents,
    world,
} = require("../wrapper/api");

const X0 = -29;
const Y0 = -66;
const DY = -10;
const YAW = 90;

class SetupSecretHolders extends AbstractSetup {
    constructor() {
        super();
    }

    setup() {
        const playerCount = world.TI4.config.playerCount;
        assert(playerCount > 0);

        const numLeft = Math.floor(playerCount / 2);

        const positions = [];
        const rotations = [];
        const z = world.getTableHeight();
        for (let i = 0; i < playerCount; i++) {
            if (i < numLeft) {
                const x = X0;
                const y = Y0 + i * DY;
                positions.push(new Vector(x, y, z));
                rotations.push(new Rotator(0, YAW, 0));
            } else {
                const iRight = playerCount - i - 1;
                const x = -X0;
                const y = Y0 + iRight * DY;
                positions.push(new Vector(x, y, z));
                rotations.push(new Rotator(0, YAW, 0));
            }
        }
        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            const nsid = "cardholder:base/large";
            const pos = positions[playerDesk.index];
            const rot = rotations[playerDesk.index];
            assert(pos && rot);
            const obj = Spawn.spawn(nsid, pos, rot);
            obj.setScale([0.73, 0.35, 0.5]);
            obj.setPrimaryColor(playerDesk.color);
            obj.setHiddenCardsType(HiddenCardsType.Front);
        }
    }

    clean() {
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            if (!(obj instanceof CardHolder)) {
                continue;
            }
            if (obj.getOwningPlayerSlot() >= 0) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (!nsid.startsWith("cardholder:")) {
                continue;
            }
            obj.destroy();
        }
    }
}

globalEvents.TI4.onPlayerCountChanged.add((playerCount, player) => {
    new SetupSecretHolders().clean();
    new SetupSecretHolders().setup();
});

module.exports = { SetupSecretHolders };
