const locale = require("../lib/locale");
const { SetupGenericPromissory } = require("../setup/setup-generic-promissory");
const { SetupGenericTechDeck } = require("../setup/setup-generic-tech-deck");
const { SetupSheets } = require("../setup/setup-sheets");
const { SetupSupplyBoxes } = require("../setup/setup-supply-boxes");
const { SetupUnits } = require("../setup/setup-units");
const { Border, Button, UIElement, VerticalBox } = require("../wrapper/api");

const DESK_UI_POSITION = {
    pos: { x: 25, y: -6, z: 10 },
};
const LARGE_FONT_SIZE = 50;

/**
 * Do not require this in player-desk.js,
 */
class PlayerDeskUI {
    constructor(playerDesk) {
        this._playerDesk = playerDesk;
    }

    create() {
        const panel = new VerticalBox()
            .setChildDistance(5)
            .addChild(this._createTakeSetButton())
            .addChild(this._createCleanButton());

        const pos = this._playerDesk.localPositionToWorld(DESK_UI_POSITION.pos);
        pos.z = 10;

        const ui = new UIElement();
        ui.position = pos;
        ui.rotation = this._playerDesk.rot;
        ui.widget = new Border().setChild(panel);

        return ui;
    }

    _createTakeSetButton() {
        const color = this._playerDesk.color;
        const buttonText = locale("ui.button.take_seat");
        const button = new Button()
            .setTextColor(color)
            .setFontSize(LARGE_FONT_SIZE)
            .setText(buttonText);
        button.onClicked.add((button, player) => {
            this._playerDesk.seatPlayer(player);
        });
        return button;
    }

    _createCleanButton() {
        const color = this._playerDesk.color;
        const buttonText = locale("ui.button.clean_seat");
        const button = new Button()
            .setTextColor(color)
            .setFontSize(LARGE_FONT_SIZE)
            .setText(buttonText);
        button.onClicked.add((button, player) => {
            const setups = [
                new SetupGenericPromissory(this._playerDesk),
                new SetupGenericTechDeck(this._playerDesk),
                new SetupUnits(this._playerDesk),
                new SetupSupplyBoxes(this._playerDesk),
                new SetupSheets(this._playerDesk),
            ];
            setups.forEach((setup) => setup.clean());
        });
        return button;
    }
}

module.exports = { PlayerDeskUI };
