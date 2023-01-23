const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { Hex } = require("../../lib/hex");
const { TableLayout } = require("../../table/table-layout");
const { WidgetFactory } = require("../../lib/ui/widget-factory");
const CONFIG = require("../../game-ui/game-ui-config");
const { TextJustification, refPackageId, world } = require("../../wrapper/api");

let _playerCountSlider = undefined;
let _setupButton = undefined;

class GameSetupUI {
    static disablePlayerCountSlider() {
        if (_playerCountSlider) {
            _playerCountSlider.setEnabled(false);
            _setupButton.setEnabled(false);
        }
    }

    static enablePlayerCountSlider() {
        if (_playerCountSlider) {
            _playerCountSlider.setEnabled(true);
            _setupButton.setEnabled(true);
        }
    }

    constructor(callbacks) {
        this._callbacks = callbacks;
    }

    create() {
        const title = WidgetFactory.text()
            .setFontSize(CONFIG.fontSize * 3)
            .setText(locale("ui.setup.title"))
            .setJustification(TextJustification.Center)
            .setFont("ambroise-firmin-bold.otf", refPackageId);

        const col1Panel = WidgetFactory.verticalBox().setChildDistance(
            CONFIG.spacing
        );
        const col2Panel = WidgetFactory.verticalBox().setChildDistance(
            CONFIG.spacing
        );
        const colsPanel = WidgetFactory.horizontalBox()
            .setChildDistance(CONFIG.spacing * 4)
            .addChild(col1Panel, 1)
            .addChild(col2Panel, 1);
        const fullPanel = WidgetFactory.verticalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(title)
            .addChild(colsPanel);

        const maxPlayerCount = Math.min(8, TableLayout.desks().length);
        _playerCountSlider = this._createSlider(
            "ui.setup.player_count",
            2,
            maxPlayerCount,
            world.TI4.config.playerCount,
            this._callbacks.onPlayerCountChanged
        );
        if (_playerCountSlider._onFreed) {
            _playerCountSlider._onFreed.add(() => {
                _playerCountSlider = undefined;
            });
        }

        col1Panel.addChild(_playerCountSlider);
        col1Panel.addChild(
            this._createSlider(
                "ui.setup.game_points",
                8,
                14,
                world.TI4.config.gamePoints,
                this._callbacks.onGamePointsChanged
            )
        );

        if (TableLayout.supportsLargeHexes) {
            col1Panel.addChild(
                this._createCheckbox(
                    "ui.setup.larger_hexes",
                    Hex.getLargerScale(),
                    this._callbacks.onUseLargerHexes
                )
            );
        }

        col1Panel.addChild(
            this._createCheckbox(
                "ui.setup.use_game_data",
                false,
                this._callbacks.onUseGameDataChanged
            )
        );
        col1Panel.addChild(
            this._createCheckbox(
                "ui.setup.report_errors",
                world.TI4.config.reportErrors,
                this._callbacks.onReportErrorsChanged
            )
        );

        col2Panel.addChild(
            this._createCheckbox(
                "ui.setup.use_pok",
                world.TI4.config.pok,
                this._callbacks.onUsePokChanged
            )
        );
        col2Panel.addChild(
            this._createCheckbox(
                "ui.setup.use_codex1",
                world.TI4.config.codex1,
                this._callbacks.onUseCodex1Changed
            )
        );
        col2Panel.addChild(
            this._createCheckbox(
                "ui.setup.use_codex2",
                world.TI4.config.codex2,
                this._callbacks.onUseCodex2Changed
            )
        );
        col2Panel.addChild(
            this._createCheckbox(
                "ui.setup.use_codex3",
                world.TI4.config.codex3,
                this._callbacks.onUseCodex3Changed
            )
        );
        col2Panel.addChild(
            this._createCheckbox(
                "ui.setup.use_codex4",
                world.TI4.config.codex4,
                this._callbacks.onUseCodex4Changed
            )
                .setEnabled(false)
                .setVisible(false)
        );
        col2Panel.addChild(
            this._createCheckbox(
                "ui.setup.use_base_magen",
                world.TI4.config.baseMagen,
                this._callbacks.onUseBaseMagenChanged
            )
        );

        _setupButton = this._createButton(
            "ui.setup.do_setup",
            this._callbacks.onSetupClicked
        );
        if (_setupButton._onFreed) {
            _setupButton._onFreed.add(() => {
                _setupButton = undefined;
            });
        }

        fullPanel.addChild(WidgetFactory.layoutBox(), 1); // weight 1 stretches to fill space
        fullPanel.addChild(_setupButton);

        return fullPanel;
    }

    _createText(localeText) {
        assert(typeof localeText === "string");

        const labelText = locale(localeText);
        const text = WidgetFactory.text()
            .setFontSize(CONFIG.fontSize)
            .setText(labelText);
        return text;
    }

    _createButton(localeLabel, onClicked) {
        assert(typeof localeLabel === "string");
        assert(typeof onClicked === "function");

        const labelText = locale(localeLabel);
        const button = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize)
            .setText(labelText);
        button.onClicked.add(onClicked);
        return button;
    }

    _createCheckbox(localeLabel, isChecked, onCheckStateChanged) {
        assert(typeof localeLabel === "string");
        assert(!isChecked || typeof isChecked === "boolean");
        assert(typeof onCheckStateChanged === "function");

        const labelText = locale(localeLabel);
        const checkBox = WidgetFactory.checkBox()
            .setFontSize(CONFIG.fontSize)
            .setText(labelText)
            .setIsChecked(isChecked ? true : false);
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
        const label = WidgetFactory.text()
            .setFontSize(CONFIG.fontSize)
            .setText(labelText);

        const slider = WidgetFactory.slider()
            .setFontSize(CONFIG.fontSize)
            .setTextBoxWidth(CONFIG.fontSize * 4)
            .setMinValue(minValue)
            .setMaxValue(maxValue)
            .setStepSize(1)
            .setValue(value);

        slider.onValueChanged.add(onValueChanged);
        return WidgetFactory.verticalBox().addChild(label).addChild(slider);
    }
}

module.exports = { GameSetupUI };
