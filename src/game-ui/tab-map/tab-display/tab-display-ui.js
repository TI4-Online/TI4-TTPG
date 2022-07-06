const assert = require("../../../wrapper/assert-wrapper");
const locale = require("../../../lib/locale");
const CONFIG = require("../../game-ui-config");
const {
    CheckBox,
    HorizontalBox,
    Slider,
    Text,
    VerticalBox,
} = require("../../../wrapper/api");
const {
    SystemTileBrightness,
} = require("../../../lib/ui/system-tile-brightness");

class TabDisplayUI extends VerticalBox {
    constructor(onClickHandlers) {
        super();

        this.setChildDistance(CONFIG.spacing);

        const enableBorders = new CheckBox()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.tab.map.display.enable_borders"));
        assert(typeof onClickHandlers.toggleBorders === "function");
        enableBorders.onCheckStateChanged.add(onClickHandlers.toggleBorders);
        this.addChild(enableBorders);

        const brightnessLabel = new Text()
            .setFontSize(CONFIG.fontSize)
            .setText(locale("ui.tab.map.display.system_brightness"));
        const brightnessSlider = new Slider()
            .setFontSize(CONFIG.fontSize)
            .setTextBoxWidth(CONFIG.fontSize * 4)
            .setMinValue(50)
            .setMaxValue(100)
            .setStepSize(5)
            .setValue(SystemTileBrightness.get() * 100);
        const brightnessPanel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(brightnessLabel)
            .addChild(brightnessSlider, 1);
        brightnessSlider.onValueChanged.add(
            onClickHandlers.systemBrightnessChanged
        );
        this.addChild(brightnessPanel);
    }
}

module.exports = { TabDisplayUI };
