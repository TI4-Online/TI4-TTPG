const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { ThrottleClickHandler } = require("../ui/throttle-click-handler");
const CONFIG = require("../../game-ui/game-ui-config");
const {
    Border,
    Button,
    HorizontalBox,
    ImageButton,
    LayoutBox,
    Text,
    TextJustification,
    UIElement,
    VerticalBox,
    refPackageId,
} = require("../../wrapper/api");

const DESK_UI = {
    pos: { x: 40, y: 0, z: 3 },
};

class PlayerDeskUI {
    constructor(playerDesk, colorOptions, callbacks) {
        this._playerDesk = playerDesk;
        this._colorOptions = colorOptions;
        this._callbacks = callbacks;

        this._callbacks.onTakeSeat = ThrottleClickHandler.wrap(
            this._callbacks.onTakeSeat
        );
        this._callbacks.onLeaveSeat = ThrottleClickHandler.wrap(
            this._callbacks.onLeaveSeat
        );
        this._callbacks.onToggleColors = ThrottleClickHandler.wrap(
            this._callbacks.onToggleColors
        );
        this._callbacks.onSetupFaction = ThrottleClickHandler.wrap(
            this._callbacks.onSetupFaction
        );
        this._callbacks.onCleanFaction = ThrottleClickHandler.wrap(
            this._callbacks.onCleanFaction
        );
        this._callbacks.onReady = ThrottleClickHandler.wrap(
            this._callbacks.onReady
        );
    }

    create(config) {
        const extraScale = 2;
        const spacing = CONFIG.spacing / extraScale;
        const panel = new VerticalBox().setChildDistance(spacing);

        // Always show take/leave seat.
        let localeText = config.isOccupied
            ? "ui.desk.leave_seat"
            : "ui.desk.take_seat";
        let onClickHandler = config.isOccupied
            ? this._callbacks.onLeaveSeat
            : this._callbacks.onTakeSeat;
        const takeSeatButton = this._createButton(localeText, onClickHandler);

        // Button to toggle color selection.
        const showColors = this._createColorSquareButton(
            this._playerDesk.plasticColor,
            this._callbacks.onToggleColors
        );
        showColors.setEnabled(!config.isReady);

        const takeSeatPanel = new HorizontalBox()
            .setChildDistance(spacing)
            .addChild(takeSeatButton, 1)
            .addChild(showColors, 0);
        panel.addChild(takeSeatPanel);

        if (config.showColors) {
            panel.addChild(
                this._createChangeColorButton(this._callbacks.onChangeColor)
            );
        }

        if (config.canFaction) {
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

        // Once a faction is selected show ready button.
        if (!config.isReady && config.hasFaction) {
            panel.addChild(
                this._createButton("ui.button.ready", this._callbacks.onReady)
            );
        }

        const pos = this._playerDesk.localPositionToWorld(DESK_UI.pos);

        const ui = new UIElement();
        ui.anchorY = 0;
        ui.position = pos;
        ui.rotation = this._playerDesk.rot;
        ui.scale = extraScale / CONFIG.scale; // Bigger than normal
        ui.widget = new Border().setChild(
            new LayoutBox()
                .setChild(panel)
                .setPadding(spacing, spacing, spacing, spacing)
                .setMinimumWidth(250 * extraScale)
        );

        return ui;
    }

    _createButton(localeLabel, onClicked) {
        assert(typeof localeLabel === "string");
        assert(typeof onClicked === "function");

        const color = this._playerDesk.plasticColor;
        const labelText = locale(localeLabel);
        const button = new Button()
            .setTextColor(color)
            .setFontSize(CONFIG.fontSize)
            .setText(labelText);
        button.onClicked.add(onClicked);
        return button;
    }

    _createColorSquareButton(color, onClicked) {
        const size = CONFIG.fontSize * 1.61;
        const imageButton = new ImageButton()
            .setImage("global/ui/white16x16.png", refPackageId)
            .setImageSize(size, size)
            .setTintColor(color);
        imageButton.onClicked.add(onClicked);
        return imageButton;
    }

    _createChangeColorButton(onClicked) {
        assert(typeof onClicked === "function");

        // Create a swatch with not-setup peer colors.
        const color = this._playerDesk.plasticColor;
        const labelText = locale("ui.desk.change_color");
        const text = new Text()
            .setTextColor(color)
            .setFontSize(CONFIG.fontSize)
            .setJustification(TextJustification.Center)
            .setText(labelText);

        const colorChoices = new HorizontalBox();
        for (const colorOption of this._colorOptions) {
            const imageButton = this._createColorSquareButton(
                colorOption.plasticColorTint,
                (button, player) => {
                    onClicked(colorOption, player);
                }
            );
            colorChoices.addChild(imageButton);
        }
        return new VerticalBox().addChild(text).addChild(colorChoices);
    }
}

module.exports = { PlayerDeskUI };
