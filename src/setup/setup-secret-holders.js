const assert = require("../wrapper/assert-wrapper");
const { AbstractSetup } = require("./abstract-setup");
const { ObjectNamespace } = require("../lib/object-namespace");
const { ObjectSavedData } = require("../lib/saved-data/object-saved-data");
const { Spawn } = require("./spawn/spawn");
const { TableLayout } = require("../table/table-layout");
const {
    CardHolder,
    HiddenCardsType,
    Rotator,
    Vector,
    globalEvents,
    world,
} = require("../wrapper/api");

const X0 = -29;
const YCENTER = 0;
const DY = -10;
const YAW = -90;
const DESK_INDEX_KEY = "deskIndex";

class SetupSecretHolders extends AbstractSetup {
    constructor() {
        super();
    }

    setup() {
        const playerCount = world.TI4.config.playerCount;
        assert(playerCount > 0);

        const numLeft = Math.floor(playerCount / 2);
        const y0 = YCENTER - ((playerCount - numLeft - 1) * DY) / 2;

        let positions = [];
        let rotations = [];
        const z = world.getTableHeight();
        for (let i = 0; i < playerCount; i++) {
            if (i < numLeft) {
                const x = X0;
                const y = y0 + i * DY;
                positions.push(new Vector(x, y, z));
                rotations.push(new Rotator(0, YAW, 0));
            } else {
                const iRight = playerCount - i - 1;
                const x = -X0;
                const y = y0 + iRight * DY;
                positions.push(new Vector(x, y, z));
                rotations.push(new Rotator(0, YAW, 0));
            }
        }

        // Move to anchor.
        positions = positions.map((pos) => {
            return this.anchorPositionToWorld(TableLayout.anchor.score, pos);
        });
        rotations = rotations.map((rot) => {
            return this.anchorRotationToWorld(TableLayout.anchor.score, rot);
        });

        for (const playerDesk of world.TI4.getAllPlayerDesks()) {
            const nsid = "cardholder:base/small";
            const pos = positions[playerDesk.index];
            const rot = rotations[playerDesk.index];
            assert(pos && rot);
            const obj = Spawn.spawn(nsid, pos, rot);
            obj.setPrimaryColor(playerDesk.color);
            obj.setHiddenCardsType(HiddenCardsType.Front);
            obj.setOnlyOwnerTakesCards(false);
            ObjectSavedData.set(obj, DESK_INDEX_KEY, playerDesk.index);
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
