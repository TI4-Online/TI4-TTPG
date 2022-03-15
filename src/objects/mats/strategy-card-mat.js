const locale = require("../../lib/locale");
const {
    UIElement,
    Vector,
    Rotator,
    Text,
    TextJustification,
    VerticalBox,
    refObject,
    refPackageId,
} = require("../../wrapper/api");

const SCALE = 2;

const _panel = new VerticalBox().setChildDistance(-8);

_panel.addChild(
    new Text()
        .setFontSize(26 * SCALE)
        .setText(locale("ui.setup.title"))
        .setJustification(TextJustification.Center)
        .setFont("ambroise_firmin_bold.otf", refPackageId)
);

_panel.addChild(
    new Text()
        .setFontSize(10 * SCALE)
        .setText(locale("ui.setup.subtitle"))
        .setJustification(TextJustification.Center)
);

const _uiElement = new UIElement();
_uiElement.anchorY = 0;
_uiElement.position = new Vector(0, 13, 0.14);
_uiElement.rotation = new Rotator(0, 90, 0);
_uiElement.widget = _panel;
_uiElement.scale = 1 / SCALE;

refObject.addUI(_uiElement);
