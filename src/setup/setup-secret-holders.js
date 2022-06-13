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

const Y0 = -33;
const XCENTER = 0;
const DX = -10;
const YAW = 0;
const DESK_INDEX_KEY = "deskIndex";

class SetupSecretHolders extends AbstractSetup {
    constructor() {
        super();
    }

    setup() {
        const playerCount = world.TI4.config.playerCount;
        assert(playerCount > 0);

        const numLeft = Math.floor(playerCount / 2);
        const x0 = XCENTER + ((playerCount - numLeft - 1) * DX) / 2;

        let positions = [];
        let rotations = [];
        const z = world.getTableHeight();
        for (let i = 0; i < playerCount; i++) {
            if (i < numLeft) {
                const y = Y0;
                const x = x0 - i * DX;
                positions.push(new Vector(x, y, z));
                rotations.push(new Rotator(0, YAW, 0));
            } else {
                const iRight = playerCount - i - 1;
                const y = -Y0;
                const x = x0 - iRight * DX;
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
            obj.setTags(["DELETED_ITEMS_IGNORE"]);
            obj.destroy();
        }
    }
}

globalEvents.TI4.onPlayerCountAboutToChange.add((playerCount, player) => {
    new SetupSecretHolders().clean();
});
globalEvents.TI4.onPlayerCountChanged.add((playerCount, player) => {
    new SetupSecretHolders().setup();
});

module.exports = { SetupSecretHolders };
