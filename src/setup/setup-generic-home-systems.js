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
    N: "<3,0,-3>",
    N_: "<5,-1,-4>",
    NE: "<0,3,-3>",
    NE_: "<2,3,-5>",
    SE: "<-3,3,0",
    SE_: "<-5,3,2>",
    S: "<-3,0,3>",
    S_: "<-5,1,4>",
    SW: "<0,-3,3>",
    SW_: "<-2,-3,5>",
    NW: "<3,-3,0>",
    NW_: "<5,-3,-2>",
};

const HOME_SYSTEM_POSITIONS = {
    2: {
        onMap: [HEX.S, HEX.N],
        offMap: [HEX.S_, HEX.N_],
    },
};

class SetupGenericHomeSystems extends AbstractSetup {
    constructor(playerDesk) {
        super(playerDesk);
    }

    setup() {
        const nsid = "tile.system:base/0";
        const pos = new Vector(0, 0, world.getTableHeight() + 5);
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
