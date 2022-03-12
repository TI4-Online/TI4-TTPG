const assert = require("../wrapper/assert-wrapper");
const locale = require("../lib/locale");
const { AbstractSetup } = require("./abstract-setup");
const { Hex } = require("../lib/hex");
const { ObjectNamespace } = require("../lib/object-namespace");
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
        { onMap: "<2,-4,2>", offMap: "<-2,-4,6>" },
        { onMap: "<4,-3,-1>", offMap: "<6,-3,-3>" },
        { onMap: "<4,0,-4>", offMap: "<6,-2,-4>" },
        HEX.NE,
    ],
    8: [
        { onMap: "<-4,3,1>", offMap: "<-6,3,3>" },
        { onMap: "<-4,0,4>", offMap: "<-6,2,4>" },
        { onMap: "<-1,-3,4>", offMap: "<-3,-3,6>" },
        { onMap: "<2,-4,2>", offMap: "<-2,-4,6>" },
        { onMap: "<4,-3,-1>", offMap: "<6,-3,-3>" },
        { onMap: "<4,0,-4>", offMap: "<6,-2,-4>" },
        { onMap: "<1,3,-4>", offMap: "<3,3,-6>" },
        { onMap: "<-2,4,-2>", offMap: "<2,4,-6>" },
    ],
};

const SPAWN_OFF_MAP_ALSO = false;

class SetupGenericHomeSystems extends AbstractSetup {
    constructor(playerDesk) {
        assert(playerDesk);
        super(playerDesk);
    }

    /**
     * Assign home system positions to be near associated player desk.
     *
     * @returns {Object} - map from player slot to position
     */
    static getPlayerSlotToHomeSystemIndex() {
        // Optimal placement is called "the assignment problem" and is tricky.
        // Make a simplifying assumption that tiles in clockwise order get the
        // player zone colors in clockwise order, choosing the best start.
        const deskIndexToAngle = {};
        const playerDeskArray = world.TI4.getAllPlayerDesks();
        playerDeskArray.forEach((playerDesk, index) => {
            const pos = playerDesk.center;
            const angle = Math.atan2(pos.y, pos.x);
            deskIndexToAngle[index] = angle;
        });

        const hexIndexToAngle = {};
        const playerCount = world.TI4.config.playerCount;
        const hexDataArray = HOME_SYSTEM_POSITIONS[playerCount];
        hexDataArray.forEach((hexData, index) => {
            const pos = Hex.toPosition(hexData.onMap);
            const angle = Math.atan2(pos.y, pos.x);
            hexIndexToAngle[index] = angle;
        });

        let best = false;
        let bestD = Number.MAX_VALUE;
        for (let candidate = 0; candidate < playerCount; candidate++) {
            let d = 0;
            for (let offset = 0; offset < playerCount; offset++) {
                const index = (offset + candidate) % playerCount;
                const deskAngle = deskIndexToAngle[offset];
                const hexAngle = hexIndexToAngle[index];
                d += Math.abs(deskAngle - hexAngle);
            }
            if (d < bestD) {
                best = candidate;
                bestD = d;
            }
        }

        const playerSlotToHomeSystemIndex = {};
        playerDeskArray.forEach((playerDesk, index) => {
            index = (index + best) % playerCount;
            const playerSlot = playerDesk.playerSlot;
            playerSlotToHomeSystemIndex[playerSlot] = index;
        });
        return playerSlotToHomeSystemIndex;
    }

    static getHomeSystemPosition(playerDesk, offMap = false) {
        const playerSlot = playerDesk.playerSlot;
        const index = this.getPlayerSlotToHomeSystemIndex()[playerSlot];

        const playerCount = world.TI4.config.playerCount;
        const hexDataArray = HOME_SYSTEM_POSITIONS[playerCount];
        const hexData = hexDataArray[index];
        const hex = offMap ? hexData.offMap : hexData.onMap;

        const pos = Hex.toPosition(hex);
        pos.z = world.getTableHeight() + 10;
        return pos;
    }

    setup(overridePos) {
        const nsid = "tile.system:base/0";
        const pos =
            overridePos ||
            SetupGenericHomeSystems.getHomeSystemPosition(this.playerDesk);
        const rot = new Rotator(0, 0, 0);
        const obj = Spawn.spawn(nsid, pos, rot);

        const color = this.playerDesk.plasticColor;
        const playerSlot = this.playerDesk.playerSlot;
        obj.setPrimaryColor(color);
        obj.setOwningPlayerSlot(playerSlot);

        this._addLabel(obj);

        // Also spawn one at off-map for visualizing.
        if (SPAWN_OFF_MAP_ALSO) {
            const pos = SetupGenericHomeSystems.getHomeSystemPosition(
                this.playerDesk,
                true
            );
            const rot = new Rotator(0, 0, 0);
            const obj = Spawn.spawn(nsid, pos, rot);
            obj.setPrimaryColor(color);
            obj.setOwningPlayerSlot(playerSlot);
        }
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
            if (nsid !== "tile.system:base/0") {
                continue;
            }
            obj.destroy();
        }
    }

    _addLabel(obj) {
        const text = new Text()
            .setText(locale("ui.label.home_system_tile"))
            .setJustification(TextJustification.Center);

        const ui = new UIElement();
        ui.position = new Vector(0, 0, 0.13);
        ui.widget = text;
        obj.addUI(ui);
    }
}

module.exports = { SetupGenericHomeSystems };
