const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const {
    Border,
    Button,
    HorizontalBox,
    Text,
    UIElement,
    VerticalBox,
} = require("../../wrapper/api");

const DESK_UI = {
    pos: { x: 30, y: 0, z: 2 },
};
const LARGE_FONT_SIZE = 30;

class PlayerDeskUI {
    constructor(playerDesk, colorOptions, callbacks) {
        this._playerDesk = playerDesk;
        this._colorOptions = colorOptions;
        this._callbacks = callbacks;
    }

    create(config) {
        const panel = new VerticalBox().setChildDistance(5);

        // ALWAYS: take/leave seat.
        if (config.isOccupied) {
            panel.addChild(
                this._createButton(
                    "ui.desk.leave_seat",
                    this._callbacks.onLeaveSeat
                )
            );
        } else {
            panel.addChild(
                this._createButton(
                    "ui.desk.take_seat",
                    this._callbacks.onTakeSeat
                )
            );
        }

        // BEFORE READY: change color.
        if (!config.isReady) {
            panel.addChild(
                this._createChangeColorButton(this._callbacks.onChangeColor)
            );
        }

        // AFTER SETUP + BEFORE READY: add/remove faction
        if (config.canFaction && !config.isReady) {
            if (config.hasFaction) {
                panel.addChild(
                    this._createButton(
                        "ui.desk.clean_faction",
                        this._callbacks.onCleanFaction
                    )
                );
            } else {
                panel.addChild(
                    this._createButton(
                        "ui.desk.setup_faction",
                        this._callbacks.onSetupFaction
                    )
                );
            }
        }

        if (!config.isReady && config.hasFaction) {
            panel.addChild(
                this._createButton("ui.desk.done", this._callbacks.onReady)
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

        const color = this._playerDesk.plasticColor;
        const labelText = locale(localeLabel);
        const button = new Button()
            .setTextColor(color)
            .setFontSize(LARGE_FONT_SIZE)
            .setText(labelText);
        button.onClicked.add(onClicked);
        return button;
    }

    _createChangeColorButton(onClicked) {
        assert(typeof onClicked === "function");

        // Create a swatch with not-setup peer colors.
        const color = this._playerDesk.plasticColor;
        const labelText = locale("ui.desk.change_color");
        const text = new Text()
            .setTextColor(color)
            .setFontSize(LARGE_FONT_SIZE)
            .setText(labelText);

        const colorChoices = new HorizontalBox();
        for (const colorOption of this._colorOptions) {
            const button = new Button()
                .setTextColor(colorOption.plasticColorTint)
                .setFontSize(LARGE_FONT_SIZE)
                .setText("[X]");
            button._colorOption = colorOption;
            button.onClicked.add((button, player) => {
                onClicked(colorOption, player);
            });
            colorChoices.addChild(button);
        }
        return new VerticalBox().addChild(text).addChild(colorChoices);
    }
}

module.exports = { PlayerDeskUI };
