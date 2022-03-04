const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");

const {
    Border,
    Button,
    CheckBox,
    Color,
    Rotator,
    Slider,
    Text,
    TextJustification,
    UIElement,
    Vector,
    VerticalBox,
    refPackageId,
    world,
} = require("../../wrapper/api");

const GAME_SETUP_UI = {
    pos: { x: 0, y: 0, z: world.getTableHeight() + 5 },
    rot: { pitch: 0, yaw: 0, roll: 0 },
};

// Large font size affects text but checkboxes don't scale with it.
const UI_SCALE = 1.25;
const UI_FONT_SIZE = 24 / UI_SCALE;

class GameSetupUI {
    constructor(callbacks) {
        this._callbacks = callbacks;
    }

    create() {
        const panel = new VerticalBox().setChildDistance(5);

        const title = new Text()
            .setFontSize(UI_FONT_SIZE * 1.2)
            .setText(locale("ui.setup.title"))
            .setJustification(TextJustification.Center)
            .setFont("ambroise_firmin_bold.otf", refPackageId);
        panel.addChild(title);

        const subtitle = new Text()
            .setFontSize(UI_FONT_SIZE * 0.6)
            .setText(locale("ui.setup.subtitle"))
            .setJustification(TextJustification.Center);
        panel.addChild(subtitle);

        const wip = new Text()
            .setFontSize(UI_FONT_SIZE)
            .setText("ALPHA TEST") // temp, no need for locale
            .setTextColor(new Color([0.8, 0.2, 0, 1]))
            .setBold(true)
            .setJustification(TextJustification.Center);
        panel.addChild(wip);

        panel.addChild(
            this._createSlider(
                "ui.setup.player_count",
                2,
                8,
                world.TI4.config.playerCount,
                this._callbacks.onPlayerCountChanged
            )
        );

        panel.addChild(
            this._createSlider(
                "ui.setup.game_points",
                10,
                14,
                world.TI4.config.gamePoints,
                this._callbacks.onGamePointsChanged
            )
        );

        panel.addChild(
            this._createCheckbox(
                "ui.setup.use_pok",
                world.TI4.config.pok,
                this._callbacks.onUsePokChanged
            )
        );
        panel.addChild(
            this._createCheckbox(
                "ui.setup.use_omega",
                world.TI4.config.omega,
                this._callbacks.onUseOmegaChanged
            )
        );
        panel.addChild(
            this._createCheckbox(
                "ui.setup.use_codex1",
                world.TI4.config.codex1,
                this._callbacks.onUseCodex1Changed
            )
        );
        panel.addChild(
            this._createCheckbox(
                "ui.setup.use_codex2",
                world.TI4.config.codex2,
                this._callbacks.onUseCodex2Changed
            )
        );
        panel.addChild(
            this._createButton(
                "ui.setup.do_setup",
                this._callbacks.onSetupClicked
            )
        );

        const pos = GAME_SETUP_UI.pos;
        const rot = GAME_SETUP_UI.rot;
        const ui = new UIElement();
        ui.position = new Vector(pos.x, pos.y, pos.z);
        ui.rotation = new Rotator(rot.pitch, rot.yaw, rot.roll);
        ui.scale = UI_SCALE;
        ui.widget = new Border().setChild(panel);
        return ui;
    }

    _createText(localeText) {
        assert(typeof localeText === "string");

        const labelText = locale(localeText);
        const text = new Text().setFontSize(UI_FONT_SIZE).setText(labelText);
        return text;
    }

    _createButton(localeLabel, onClicked) {
        assert(typeof localeLabel === "string");
        assert(typeof onClicked === "function");

        const labelText = locale(localeLabel);
        const button = new Button()
            .setFontSize(UI_FONT_SIZE)
            .setText(labelText);
        button.onClicked.add(onClicked);
        return button;
    }

    _createCheckbox(localeLabel, isChecked, onCheckStateChanged) {
        assert(typeof localeLabel === "string");
        assert(typeof isChecked === "boolean");
        assert(typeof onCheckStateChanged === "function");

        const labelText = locale(localeLabel);
        const checkBox = new CheckBox()
            .setFontSize(UI_FONT_SIZE)
            .setText(labelText)
            .setIsChecked(isChecked);
        checkBox.onCheckStateChanged.add(onCheckStateChanged);
        return checkBox;
    }

    _createSlider(localeLabel, minValue, maxValue, value, onValueChanged) {
        assert(typeof localeLabel === "string");
        assert(typeof minValue === "number");
        assert(typeof maxValue === "number");
        assert(typeof value === "number");
        assert(typeof onValueChanged === "function");

        const labelText = locale(localeLabel);
        const label = new Text().setFontSize(UI_FONT_SIZE).setText(labelText);

        const slider = new Slider()
            .setFontSize(UI_FONT_SIZE)
            .setMinValue(minValue)
            .setMaxValue(maxValue)
            .setStepSize(1)
            .setTextBoxWidth(UI_FONT_SIZE * 3)
            .setValue(value);

        slider.onValueChanged.add(onValueChanged);
        return new VerticalBox().addChild(label).addChild(slider);
    }
}

module.exports = { GameSetupUI };
