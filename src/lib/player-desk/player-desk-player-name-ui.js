const assert = require("../../wrapper/assert-wrapper");
const {
    Border,
    Color,
    LayoutBox,
    Rotator,
    Text,
    TextJustification,
    UIElement,
    globalEvents,
    world,
} = require("../../wrapper/api");

const NAME_DATA = {
    border: 8,
    fontSize: 80,
    pos: {
        x: -60,
        y: 0,
        z: 0,
    },
    rot: {
        pitch: 20, // 90 makes it rotate the wrong way
        yaw: 180,
        roll: 0,
    },
};

/**
 * Display name behind desk.  PlayerDesk proper resets UIs when players
 * change color, no need to listen for those events here.
 */
class PlayerDeskPlayerNameUI {
    constructor(playerDesk) {
        assert(playerDesk);
        this._playerDesk = playerDesk;

        this._names = [];
        this._innerBorders = [];
        this._outerBorders = [];
        this._uis = [];

        this._createName(new Rotator(0, 0, 0));

        this._update();
        this._eventHandler = () => {
            if (!world.__isMock) {
                // Let other handlers finish, system process.  When a player
                // joins they may not have a name yet.
                process.nextTick(() => {
                    this._update();
                });
            }
        };
    }

    addUI() {
        this._uis.forEach((ui) => {
            world.addUI(ui);
        });
        globalEvents.TI4.onTurnChanged.add(this._eventHandler);
        globalEvents.TI4.onTurnOrderChanged.add(this._eventHandler);
        globalEvents.onPlayerJoined.add(this._eventHandler);
        globalEvents.onPlayerSwitchedSlots.add(this._eventHandler);
    }

    removeUI() {
        this._uis.forEach((ui) => {
            world.removeUIElement(ui);
        });
        globalEvents.TI4.onTurnChanged.remove(this._eventHandler);
        globalEvents.TI4.onTurnOrderChanged.remove(this._eventHandler);
        globalEvents.onPlayerJoined.remove(this._eventHandler);
        globalEvents.onPlayerSwitchedSlots.remove(this._eventHandler);
    }

    /**
     * Add a name UI.  Could have more than one (e.g. front/back).
     *
     * @param {Rotator} rot
     */
    _createName(rot) {
        assert(typeof rot.yaw === "number");

        rot = new Rotator(
            NAME_DATA.rot.pitch,
            NAME_DATA.rot.yaw,
            NAME_DATA.rot.roll
        ).compose(rot);

        const name = new Text()
            .setFontSize(NAME_DATA.fontSize)
            .setJustification(TextJustification.Center);
        const innerBorder = new Border().setChild(name);
        const layoutBox = new LayoutBox()
            .setPadding(
                NAME_DATA.border,
                NAME_DATA.border,
                NAME_DATA.border,
                NAME_DATA.border
            )
            .setMinimumWidth(500)
            .setChild(innerBorder);
        const outerBorder = new Border().setChild(layoutBox);
        const ui = new UIElement();
        ui.position = this._playerDesk.localPositionToWorld(NAME_DATA.pos);
        ui.rotation = this._playerDesk.localRotationToWorld(rot);
        ui.widget = outerBorder;
        ui.anchorY = 1; // bottom

        this._names.push(name);
        this._innerBorders.push(innerBorder);
        this._outerBorders.push(outerBorder);
        this._uis.push(ui);
    }

    _update() {
        const playerSlot = this._playerDesk.playerSlot;
        const player = world.getPlayerBySlot(playerSlot);
        const playerName = player ? player.getName() : "";

        const v = 0.05;
        const altColor = new Color(v, v, v);
        const isTurn = world.TI4.turns.getCurrentTurn() === this._playerDesk;
        const fgColor = isTurn ? altColor : this._playerDesk.plasticColor;
        const bgColor = isTurn ? this._playerDesk.plasticColor : altColor;

        this._outerBorders.forEach((border) => {
            border.setColor(fgColor);
        });
        this._innerBorders.forEach((border) => {
            border.setColor(bgColor);
        });
        this._names.forEach((name) => {
            name.setTextColor(fgColor).setText(` ${playerName} `);
        });
        this._uis.forEach((ui) => {
            world.updateUI(ui);
        });
    }
}

module.exports = { PlayerDeskPlayerNameUI };
