const locale = require("../lib/locale");
const { PlayerDeskSetup } = require("./player-desk-setup");
const {
    Border,
    Button,
    HorizontalBox,
    Text,
    UIElement,
    VerticalBox,
    globalEvents,
    world,
} = require("../wrapper/api");

const DESK_UI_POSITION = {
    pos: { x: 25, y: -6, z: 5 },
};
const LARGE_FONT_SIZE = 30;

/**
 * Do not require this in player-desk.js,
 */
class PlayerDeskUI {
    constructor(playerDesk) {
        this._playerDesk = playerDesk;
    }

    create() {
        const playerSlot = this._playerDesk.playerSlot;

        const panel = new VerticalBox().setChildDistance(5);

        if (!world.getPlayerBySlot(playerSlot)) {
            panel.addChild(this._createTakeSeatButton());
        }

        let isSetup = this._playerDesk.isSetup();
        if (isSetup) {
            panel.addChild(this._createCleanButton());
        } else {
            panel.addChild(this._createChangeColorButton());
            panel.addChild(this._createSetupButton());
        }

        if (world.TI4.getFactionByPlayerSlot(playerSlot)) {
            panel.addChild(this._createCleanFactionButton());
        } else {
            panel.addChild(this._createSetupFactionButton());
        }

        const pos = this._playerDesk.localPositionToWorld(DESK_UI_POSITION.pos);
        pos.z = world.getTableHeight() + 0.5;

        const ui = new UIElement();
        ui.position = pos;
        ui.rotation = this._playerDesk.rot;
        ui.widget = new Border().setChild(panel);

        return ui;
    }

    _createTakeSeatButton() {
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

    _createChangeColorButton() {
        // Create a swatch with not-setup peer colors.
        const color = this._playerDesk.color;
        const labelText = locale("ui.label.change_color");
        const text = new Text()
            .setTextColor(color)
            .setFontSize(LARGE_FONT_SIZE)
            .setText(labelText);

        const colorChoices = new HorizontalBox();
        for (const colorOption of this._playerDesk.getColorOptions()) {
            const button = new Button()
                .setTextColor(colorOption.color)
                .setFontSize(LARGE_FONT_SIZE)
                .setText("[X]");
            button.onClicked.add((button, player) => {
                const success = this._playerDesk.changeColor(
                    colorOption.colorName,
                    colorOption.color
                );
                if (!success) {
                    player.showMessage(locale("ui.message.color_in_use"));
                }
            });
            colorChoices.addChild(button);
        }
        return new VerticalBox().addChild(text).addChild(colorChoices);
    }

    _createSetupButton() {
        const color = this._playerDesk.color;
        const buttonText = locale("ui.button.setup_desk");
        const button = new Button()
            .setTextColor(color)
            .setFontSize(LARGE_FONT_SIZE)
            .setText(buttonText);
        button.onClicked.add((button, player) => {
            new PlayerDeskSetup(this._playerDesk).setupGeneric();
            this._playerDesk.resetUI();
        });
        return button;
    }

    _createCleanButton() {
        const color = this._playerDesk.color;
        const buttonText = locale("ui.button.clean_desk");
        const button = new Button()
            .setTextColor(color)
            .setFontSize(LARGE_FONT_SIZE)
            .setText(buttonText);
        button.onClicked.add((button, player) => {
            new PlayerDeskSetup(this._playerDesk).cleanGeneric();
            this._playerDesk.resetUI();
        });
        return button;
    }

    _createSetupFactionButton() {
        const color = this._playerDesk.color;
        const buttonText = locale("ui.button.setup_faction");
        const button = new Button()
            .setTextColor(color)
            .setFontSize(LARGE_FONT_SIZE)
            .setText(buttonText);
        button.onClicked.add((button, player) => {
            new PlayerDeskSetup(this._playerDesk).setupFaction();
            const playerSlot = this._playerDesk.playerSlot;
            globalEvents.TI4.onFactionChanged.trigger(playerSlot, player);
            this._playerDesk.resetUI();
        });
        return button;
    }

    _createCleanFactionButton() {
        const color = this._playerDesk.color;
        const buttonText = locale("ui.button.clean_faction");
        const button = new Button()
            .setTextColor(color)
            .setFontSize(LARGE_FONT_SIZE)
            .setText(buttonText);
        button.onClicked.add((button, player) => {
            new PlayerDeskSetup(this._playerDesk).cleanFaction();
            const playerSlot = this._playerDesk.playerSlot;
            globalEvents.TI4.onFactionChanged.trigger(playerSlot, player);
            this._playerDesk.resetUI();
        });
        return button;
    }
}

module.exports = { PlayerDeskUI };
