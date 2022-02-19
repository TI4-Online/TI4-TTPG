const assert = require("../wrapper/assert-wrapper");
const locale = require("../lib/locale");
const { PlayerDeskSetup } = require("./player-desk-setup");
const {
    Border,
    Button,
    HorizontalBox,
    Text,
    UIElement,
    VerticalBox,
    world,
} = require("../wrapper/api");

const DESK_UI = {
    pos: { x: 30, y: 0, z: 2 },
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
        const isDeskSetup = this._playerDesk.isDeskSetup();
        const isFaction = world.TI4.getFactionByPlayerSlot(playerSlot);
        const isReady = this._playerDesk.isDeskReady();

        const panel = new VerticalBox().setChildDistance(5);

        // Take/leave seat.
        if (!world.getPlayerBySlot(playerSlot)) {
            panel.addChild(
                this._createButton("ui.desk.take_seat", (button, player) => {
                    this._playerDesk.seatPlayer(player);
                })
            );
        } else {
            panel.addChild(
                this._createButton("ui.desk.leave_seat", (button, player) => {
                    this._playerDesk.unseatPlayer();
                })
            );
        }

        // Change color.
        if (!isReady) {
            panel.addChild(this._createChangeColorButton());
        }

        // Setup/clean desk.
        if (!isReady && !isFaction) {
            if (isDeskSetup) {
                panel.addChild(
                    this._createButton(
                        "ui.desk.clean_desk",
                        (button, player) => {
                            new PlayerDeskSetup(
                                this._playerDesk
                            ).cleanGeneric();
                            this._playerDesk.resetUI();
                        }
                    )
                );
            } else {
                panel.addChild(
                    this._createButton(
                        "ui.desk.setup_desk",
                        (button, player) => {
                            new PlayerDeskSetup(
                                this._playerDesk
                            ).setupGeneric();
                            this._playerDesk.resetUI();
                        }
                    )
                );
            }
        }

        // If setup main desk, setup/clean faction.
        if (!isReady && isDeskSetup) {
            if (isFaction) {
                panel.addChild(
                    this._createButton(
                        "ui.desk.clean_faction",
                        (button, player) => {
                            new PlayerDeskSetup(
                                this._playerDesk
                            ).cleanFaction();
                            this._playerDesk.resetUI();
                        }
                    )
                );
            } else {
                panel.addChild(
                    this._createButton(
                        "ui.desk.setup_faction",
                        (button, player) => {
                            new PlayerDeskSetup(
                                this._playerDesk
                            ).setupFaction();
                            this._playerDesk.resetUI();
                        }
                    )
                );
            }
        }

        if (!isReady && isDeskSetup && isFaction) {
            panel.addChild(
                this._createButton("ui.desk.done", (button, player) => {
                    this._playerDesk.setReady(true);
                    this._playerDesk.resetUI();
                })
            );
        }

        const pos = this._playerDesk.localPositionToWorld(DESK_UI.pos);

        const ui = new UIElement();
        ui.position = pos;
        ui.rotation = this._playerDesk.rot;
        ui.widget = new Border().setChild(panel);

        return ui;
    }

    _createButton(localeLabel, onClicked) {
        assert(typeof localeLabel === "string");
        assert(typeof onClicked === "function");

        const color = this._playerDesk.color;
        const labelText = locale(localeLabel);
        const button = new Button()
            .setTextColor(color)
            .setFontSize(LARGE_FONT_SIZE)
            .setText(labelText);
        button.onClicked.add(onClicked);
        return button;
    }

    _createChangeColorButton() {
        // Create a swatch with not-setup peer colors.
        const color = this._playerDesk.color;
        const labelText = locale("ui.desk.change_color");
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
                    player.showMessage(locale("ui.desk.color_in_use"));
                }
            });
            colorChoices.addChild(button);
        }
        return new VerticalBox().addChild(text).addChild(colorChoices);
    }
}

module.exports = { PlayerDeskUI };
