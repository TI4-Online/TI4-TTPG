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
    world,
} = require("../../wrapper/api");

const DESK_UI = {
    pos: { x: 40, y: 0, z: 3 },
};

const EXTRA_SCALE = 1.5;
const SPACING = Math.round(CONFIG.spacing / EXTRA_SCALE);

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

        this._ui = undefined;

        this._panel = new VerticalBox().setChildDistance(SPACING);

        this._takeSeatButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText("X");

        this._changeColorButton = this._createColorSquareButton(
            this._playerDesk.plasticColor,
            this._callbacks.onToggleColors
        );

        this._takeSeatPanel = new HorizontalBox()
            .setChildDistance(SPACING)
            .addChild(this._takeSeatButton, 1)
            .addChild(this._changeColorButton);

        this._colorOptionsPanel = this._createChangeColorButton(
            this._callbacks.onChangeColor
        );

        this._setupFactionButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText("X");

        this._readyButton = new Button()
            .setFontSize(CONFIG.fontSize)
            .setText("X");

        this._panel
            .addChild(this._takeSeatPanel)
            .addChild(this._colorOptionsPanel)
            .addChild(this._setupFactionButton)
            .addChild(this._readyButton);

        // Pad panel.
        const panelPadded = new LayoutBox()
            .setPadding(SPACING, SPACING, SPACING, SPACING)
            .setMinimumWidth(350 * EXTRA_SCALE)
            .setChild(this._panel);

        const pos = this._playerDesk.localPositionToWorld(DESK_UI.pos);

        this._ui = new UIElement();
        this._ui.anchorY = 0;
        this._ui.position = pos;
        this._ui.rotation = this._playerDesk.rot;
        this._ui.scale = EXTRA_SCALE / CONFIG.scale; // Bigger than normal
        this._ui.widget = new Border().setChild(panelPadded);

        return this;
    }

    addUI() {
        assert(this._ui);
        world.addUI(this._ui);
        return this;
    }

    removeUI() {
        assert(this._ui);
        world.removeUIElement(this._ui);
        this._ui = undefined;
        return this;
    }

    update(config) {
        // Always show take/leave seat.
        let localeText = config.isOccupied
            ? "ui.desk.leave_seat"
            : "ui.desk.take_seat";
        let onClickHandler = config.isOccupied
            ? this._callbacks.onLeaveSeat
            : this._callbacks.onTakeSeat;
        this._takeSeatButton.setText(locale(localeText));
        this._takeSeatButton.onClicked.clear();
        this._takeSeatButton.onClicked.add(onClickHandler);

        // Button to toggle color selection.
        this._changeColorButton.setEnabled(!config.isReady);
        this._changeColorButton.setTintColor(this._playerDesk.plasticColor);

        if (config.canFaction) {
            if (config.hasFaction) {
                localeText = "ui.desk.clean_faction";
                onClickHandler = this._callbacks.onCleanFaction;
            } else {
                localeText = "ui.desk.setup_faction";
                onClickHandler = this._callbacks.onSetupFaction;
            }
            this._setupFactionButton.setText(locale(localeText));
            this._setupFactionButton.onClicked.clear();
            this._setupFactionButton.onClicked.add(onClickHandler);
        }

        // Once a faction is selected enable ready button.
        if (!config.isReady) {
            (localeText = "ui.button.ready"),
                (onClickHandler = this._callbacks.onReady);
            this._readyButton.setText(locale(localeText));
            this._readyButton.onClicked.clear();
            this._readyButton.onClicked.add(onClickHandler);
            this._readyButton.setEnabled(config.hasFaction);
        }

        // Show hide UI widgets.
        this._panel.removeAllChildren();
        this._panel.addChild(this._takeSeatPanel);
        if (config.showColors) {
            this._panel.addChild(this._colorOptionsPanel);
        }
        if (config.canFaction) {
            this._panel.addChild(this._setupFactionButton);
        }
        if (!config.isReady) {
            this._panel.addChild(this._readyButton);
        }

        return this;
    }

    _createColorSquareButton(color, onClicked) {
        const size = Math.round(CONFIG.fontSize * 1.61);
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
        const labelText = locale("ui.desk.change_color");
        const text = new Text()
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
