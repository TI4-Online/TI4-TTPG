const assert = require("../../wrapper/assert-wrapper");
const {
    Border,
    LayoutBox,
    Rotator,
    Text,
    UIElement,
    world,
} = require("../../wrapper/api");

const NAME_DATA = {
    border: 5,
    fontSize: 80,
    pos: {
        x: -50,
        y: 0,
        z: 0,
    },
    rot: {
        pitch: 0, // 90 makes it rotate the wrong way
        yaw: 180,
        roll: 0,
    },
};

/**
 * Display name behind desk.
 */
class PlayerDeskPlayerNameUI {
    constructor(playerDesk) {
        assert(playerDesk);
        this._playerDesk = playerDesk;

        this._borders = [];
        this._names = [];
        this._uis = [];

        this._createName(new Rotator(0, 0, 0));

        this._update();
    }

    addUI() {
        this._uis.forEach((ui) => {
            world.addUI(ui);
        });
    }

    removeUI() {
        this._uis.forEach((ui) => {
            world.removeUIElement(ui);
        });
    }

    _createName(rot) {
        assert(typeof rot.yaw === "number");

        rot = new Rotator(
            NAME_DATA.rot.pitch,
            NAME_DATA.rot.yaw,
            NAME_DATA.rot.roll
        ).compose(rot);

        const name = new Text().setFontSize(NAME_DATA.fontSize);
        const innerBorder = new Border().setChild(name);
        const layoutBox = new LayoutBox()
            .setPadding(
                NAME_DATA.border,
                NAME_DATA.border,
                NAME_DATA.border,
                NAME_DATA.border
            )
            .setChild(innerBorder);
        const outerBorder = new Border().setChild(layoutBox);
        const ui = new UIElement();
        ui.position = this._playerDesk.localPositionToWorld(NAME_DATA.pos);
        ui.rotation = this._playerDesk.localRotationToWorld(rot);
        ui.widget = outerBorder;

        this._names.push(name);
        this._borders.push(outerBorder);
        this._uis.push(ui);
    }

    _update() {
        const playerSlot = this._playerDesk.playerSlot;
        const player = world.getPlayerBySlot(playerSlot);
        const playerName = player ? player.getName() : "???";

        this._borders.forEach((border) => {
            border.setColor(this._playerDesk.plasticColor);
        });
        this._names.forEach((name) => {
            name.setTextColor(this._playerDesk.plasticColor).setText(
                playerName
            );
        });
    }
}

module.exports = { PlayerDeskPlayerNameUI };
