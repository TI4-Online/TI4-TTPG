const locale = require("../lib/locale");
const { Button, UIElement } = require("../wrapper/api");

const TAKE_SEAT_BUTTON = {
    pos: { x: 25, y: -6, z: 10 },
};

class PlayerDeskUI {
    constructor(playerDesk) {
        this._playerDesk = playerDesk;
    }

    create() {
        const color = this._playerDesk.color;
        const buttonText = locale("ui.button.take_seat");
        const button = new Button()
            .setTextColor(color)
            .setFontSize(50)
            .setText(buttonText);
        button.onClicked.add((button, player) => {
            this._playerDesk.seatPlayer(player);
        });

        const pos = this._playerDesk.localPositionToWorld(TAKE_SEAT_BUTTON.pos);
        pos.z = 10;

        const ui = new UIElement();
        ui.position = pos;
        ui.rotation = this._playerDesk.rot;
        ui.widget = button;

        return ui;
    }
}

module.exports = { PlayerDeskUI };
