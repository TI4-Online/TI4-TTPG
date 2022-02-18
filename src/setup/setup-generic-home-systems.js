const assert = require("../wrapper/assert-wrapper");
const locale = require("../lib/locale");
const { AbstractSetup } = require("./abstract-setup");
const { Hex } = require("../lib/hex");
const { Spawn } = require("./spawn/spawn");
const {
    Rotator,
    Text,
    TextJustification,
    UIElement,
    Vector,
    world,
} = require("../wrapper/api");

// "Standard" home system locations, and suggested off-map positions keeping
// closer to the center of the table but pushed out (north and south).  The
// idea is to leave the long ends clear for other use.
const HEX = {
    N: { onMap: "<3,0,-3>", offMap: "<5,-1,-4>" },
    NE: { onMap: "<0,3,-3>", offMap: "<2,3,-5>" },
    SE: { onMap: "<-3,3,0>", offMap: "<-5,3,2>" },
    S: { onMap: "<-3,0,3>", offMap: "<-5,1,4>" },
    SW: { onMap: "<0,-3,3>", offMap: "<-2,-3,5>" },
    NW: { onMap: "<3,-3,0>", offMap: "<5,-3,-2>" },
};

const HOME_SYSTEM_POSITIONS = {
    1: [HEX.S],
    2: [HEX.S, HEX.N],
    3: [HEX.SE, HEX.NW, HEX.NE],
    4: [HEX.SE, HEX.SW, HEX.NW, HEX.NE],
    5: [HEX.SE, HEX.SW, HEX.NW, HEX.N, HEX.NE],
    6: [HEX.SE, HEX.S, HEX.SW, HEX.NW, HEX.N, HEX.NE],
    7: [
        HEX.SE,
        { onMap: "<-4,0,4>", offMap: "<-6,2,4>" },
        { onMap: "<-1,-3,4>", offMap: "<-3,-3,6>" },
        { onMap: "<-2,4,2>", offMap: "<-2,-4,6>" },
        { onMap: "<4,-3,-1>", offMap: "<6,-3,-3>" },
        { onMap: "<4,0,-4>", offMap: "<6,-2,-4>" },
        HEX.NE,
    ],
    8: [
        { onMap: "<-4,3,1>", offMap: "<-6,3,3>" },
        { onMap: "<-4,0,4>", offMap: "<-6,2,4>" },
        { onMap: "<-1,-3,4>", offMap: "<-3,-3,6>" },
        { onMap: "<-2,4,2>", offMap: "<-2,-4,6>" },
        { onMap: "<4,-3,-1>", offMap: "<6,-3,-3>" },
        { onMap: "<4,0,-4>", offMap: "<6,-2,-4>" },
        { onMap: "<1,3,-4>", offMap: "<3,3,-6>" },
        { onMap: "<2,4,-2>", offMap: "<2,4,-6>" },
    ],
};

class SetupGenericHomeSystems extends AbstractSetup {
    constructor(playerDesk) {
        assert(playerDesk);
        super(playerDesk);
    }

    static getHomeSystemPosition(playerDesk, offMap = false) {
        const playerCount = world.TI4.getPlayerCount();
        const deskIndex = playerDesk.index;
        const hexArray = HOME_SYSTEM_POSITIONS[playerCount];
        const hexData = hexArray[deskIndex];
        const hex = offMap ? hexData.offMap : hexData.onMap;
        const pos = Hex.toPosition(hex);
        pos.z = world.getTableHeight();
        return pos;
    }

    setup(overridePos) {
        const nsid = "tile.system:base/0";
        const pos =
            overridePos ||
            SetupGenericHomeSystems.getHomeSystemPosition(this.playerDesk);
        const rot = new Rotator(0, 0, 0);
        const obj = Spawn.spawn(nsid, pos, rot);

        const color = this.playerDesk.color;
        const playerSlot = this.playerDesk.playerSlot;
        obj.setPrimaryColor(color);
        obj.setOwningPlayerSlot(playerSlot);

        const text = new Text()
            .setText(locale("ui.label.home_system_tile"))
            .setJustification(TextJustification.Center);

        const ui = new UIElement();
        ui.position = new Vector(0, 0, 0.13);
        ui.widget = text;
        obj.addUI(ui);

        obj.onSnapped.add(
            (object, player, snapPoint, grabPosition, grabRotation) => {
                //const pos = snapPoint.getGlobalPosition();
                const pos = object.getPosition();
                const hex = Hex.fromPosition(pos);
                text.setText(hex);
                obj.updateUI(ui);
            }
        );
        obj.onReleased.add((object) => {
            const pos = object.getPosition();
            const hex = Hex.fromPosition(pos);
            text.setText(hex);
            obj.updateUI(ui);
        });
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
            obj.destroy();
        }
    }
}

module.exports = { SetupGenericHomeSystems };
