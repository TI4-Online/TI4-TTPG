const assert = require("../../../wrapper/assert-wrapper");
const locale = require("../../../lib/locale");
const CONFIG = require("../../game-ui-config");
const {
    SystemTileBrightness,
} = require("../../../lib/ui/system-tile-brightness");
const { WidgetFactory } = require("../../../lib/ui/widget-factory");
const {
    ThrottleClickHandler,
} = require("../../../lib/ui/throttle-click-handler");

class TabDisplayUI {
    constructor(onClickHandlers) {
        this._verticalBox = WidgetFactory.verticalBox().setChildDistance(
            CONFIG.spacing
        );

        const enableBorders = WidgetFactory.checkBox()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.tab.map.display.enable_borders"));
        assert(typeof onClickHandlers.toggleBorders === "function");
        enableBorders.onCheckStateChanged.add(onClickHandlers.toggleBorders);
        this._verticalBox.addChild(enableBorders);

        const teamBorders = WidgetFactory.checkBox()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.tab.map.display.team_borders"));
        assert(typeof onClickHandlers.teamBorders === "function");
        teamBorders.onCheckStateChanged.add(onClickHandlers.teamBorders);
        this._verticalBox.addChild(teamBorders);

        const toggleBordersPerPlayer = WidgetFactory.button()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.tab.map.display.toggle_per_player_borders"));
        toggleBordersPerPlayer.onClicked.add(
            ThrottleClickHandler.wrap((button, player) => {
                onClickHandlers.toggleBordersPerPlayerSlot(player.getSlot());
            })
        );
        this._verticalBox.addChild(toggleBordersPerPlayer);

        const brightnessLabel = WidgetFactory.text()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.tab.map.display.system_brightness"));
        const brightnessSlider = WidgetFactory.slider()
            .setFontSize(CONFIG.fontSize)
            .setTextBoxWidth(CONFIG.fontSize * 4)
            .setMinValue(50)
            .setMaxValue(100)
            .setStepSize(5)
            .setValue(SystemTileBrightness.get() * 100);
        const brightnessPanel = WidgetFactory.horizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(brightnessLabel)
            .addChild(brightnessSlider, 1);
        brightnessSlider.onValueChanged.add(
            onClickHandlers.systemBrightnessChanged
        );
        this._verticalBox.addChild(brightnessPanel);

        // Disable toggle when borders are not enabled.
        toggleBordersPerPlayer.setEnabled(enableBorders.isChecked());
        enableBorders.onCheckStateChanged.add(() => {
            toggleBordersPerPlayer.setEnabled(enableBorders.isChecked());
        });
    }

    getWidget() {
        return this._verticalBox;
    }
}

module.exports = { TabDisplayUI };
