const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");

const {
    Border,
    Button,
    CheckBox,
    Rotator,
    Slider,
    Text,
    UIElement,
    Vector,
    VerticalBox,
    world,
} = require("../../wrapper/api");

const GAME_SETUP_UI = {
    pos: { x: 0, y: 0, z: world.getTableHeight() + 5 },
    rot: { pitch: 0, yaw: 0, roll: 0 },
};
const LARGE_FONT_SIZE = 30;

class GameSetupUI {
    constructor(state, callbacks) {
        this._state = state;
        this._callbacks = callbacks;
    }

    create() {
        const panel = new VerticalBox().setChildDistance(5);

        panel.addChild(this._createText("ui.setup.banner"));

        panel.addChild(
            this._createSlider(
                "ui.setup.player_count",
                2,
                8,
                world.TI4.getPlayerCount(),
                this._callbacks.onPlayerCountChanged
            )
        );

        panel.addChild(
            this._createSlider(
                "ui.setup.game_points",
                10,
                14,
                this._state.gamePoints,
                this._callbacks.onGamePointsChanged
            )
        );

        panel.addChild(
            this._createCheckbox(
                "ui.setup.use_pok",
                this._state.usePoK,
                this._callbacks.onUsePokChanged
            )
        );
        panel.addChild(
            this._createCheckbox(
                "ui.setup.use_codex1",
                this._state.useCodex1,
                this._callbacks.onUseCodex1Changed
            )
        );
        panel.addChild(
            this._createCheckbox(
                "ui.setup.use_codex2",
                this._state.useCodex2,
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
        ui.widget = new Border().setChild(panel);
        return ui;
    }

    _createText(localeText) {
        assert(typeof localeText === "string");

        const labelText = locale(localeText);
        const text = new Text().setFontSize(LARGE_FONT_SIZE).setText(labelText);
        return text;
    }

    _createButton(localeLabel, onClicked) {
        assert(typeof localeLabel === "string");
        assert(typeof onClicked === "function");

        const labelText = locale(localeLabel);
        const button = new Button()
            .setFontSize(LARGE_FONT_SIZE)
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
            .setFontSize(LARGE_FONT_SIZE)
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
        const label = new Text()
            .setFontSize(LARGE_FONT_SIZE)
            .setText(labelText);

        const slider = new Slider()
            .setFontSize(LARGE_FONT_SIZE)
            .setMinValue(minValue)
            .setMaxValue(maxValue)
            .setStepSize(1)
            .setValue(value);

        slider.onValueChanged.add(onValueChanged);
        return new VerticalBox().addChild(label).addChild(slider);
    }
}

module.exports = { GameSetupUI };
