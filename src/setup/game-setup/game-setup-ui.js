const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { ColorUtil } = require("../../lib/color/color-util");
const { Hex } = require("../../lib/hex");
const { PlayerDeskColor } = require("../../lib/player-desk/player-desk-color");
const { TableLayout } = require("../../table/table-layout");
const { ThrottleClickHandler } = require("../../lib/ui/throttle-click-handler");
const { WidgetFactory } = require("../../lib/ui/widget-factory");
const CONFIG = require("../../game-ui/game-ui-config");
const {
    TextJustification,
    globalEvents,
    refPackageId,
    world,
} = require("../../wrapper/api");
const { TableColor } = require("../../lib/display/table-color");

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

    create(useGameDataDefaultValue) {
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
        col1Panel.addChild(
            this._createCheckbox(
                "ui.setup.dark_table",
                TableColor.isDark(),
                this._callbacks.onDarkTableChanged
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
                useGameDataDefaultValue,
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

        /*
        col1Panel.addChild(
            this._createButton(
                "ui.setup.config_homebrew",
                this._callbacks.onConfigHomebrew
            )
        );
*/

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

        fullPanel.addChild(WidgetFactory.layoutBox(), 1); // weight 1 stretches to fill space

        if (TableLayout.getTableType() !== "6p-skinny") {
            const wrongTableWarning = this._createText(
                locale("ui.setup.suggest_6p_skinny")
            );
            const wrongColorHex =
                PlayerDeskColor.getColorAttrs("red").widgetHexColor;
            const wrongColor = ColorUtil.colorFromHex(wrongColorHex);
            wrongTableWarning
                .setJustification(TextJustification.Center)
                .setTextColor(wrongColor)
                .setVisible(world.TI4.config.playerCount <= 6);
            fullPanel.addChild(wrongTableWarning);

            globalEvents.TI4.onPlayerCountChanged.add((playerCount) => {
                wrongTableWarning.setVisible(playerCount <= 6);
            });
        }

        _setupButton = this._createButton(
            "ui.setup.do_setup",
            this._callbacks.onSetupClicked
        );
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

        onClicked = ThrottleClickHandler.wrap(onClicked);
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
        return WidgetFactory.horizontalBox()
            .addChild(label, 5)
            .addChild(slider, 5);
    }
}

module.exports = { GameSetupUI };
