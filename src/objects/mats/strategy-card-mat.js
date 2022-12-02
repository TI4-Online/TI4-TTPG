const { Border } = require("@tabletop-playground/api");
const { GameUI } = require("../../game-ui/game-ui");
const locale = require("../../lib/locale");
const {
    Button,
    HorizontalBox,
    Rotator,
    Text,
    TextJustification,
    UIElement,
    Vector,
    VerticalBox,
    refObject,
    refPackageId,
} = require("../../wrapper/api");

const SCALE = 2;

const _title = new Text()
    .setFontSize(26 * SCALE)
    .setText(locale("ui.setup.title"))
    .setJustification(TextJustification.Center)
    .setFont("ambroise-firmin-bold.otf", refPackageId);

const _subtitle = new Text()
    .setFontSize(10 * SCALE)
    .setText(locale("ui.setup.subtitle"))
    .setJustification(TextJustification.Center);

const _showStrategyPhase = new Button()
    .setFontSize(7 * SCALE)
    .setText(locale("ui.setup.strategy_phase"));
_showStrategyPhase.onClicked.add((button, player) => {
    GameUI.getInstance().showStrategyPhase();
});
const _strategyPhaseBorder = new Border().setChild(_showStrategyPhase);

const _showStatusPhase = new Button()
    .setFontSize(7 * SCALE)
    .setText(locale("ui.setup.status_phase"));
_showStatusPhase.onClicked.add((button, player) => {
    GameUI.getInstance().showStatusPhase();
});
const _statusPhaseBorder = new Border().setChild(_showStatusPhase);

const _subtitleRow = new HorizontalBox()
    .addChild(_strategyPhaseBorder, 1)
    .addChild(_subtitle, 3)
    .addChild(_statusPhaseBorder, 1);

const _panel = new VerticalBox()
    .setChildDistance(-8)
    .addChild(_title)
    .addChild(_subtitleRow);

const _uiElement = new UIElement();
_uiElement.anchorY = 0;
_uiElement.position = new Vector(0, 13, 0.14);
_uiElement.rotation = new Rotator(0, 90, 0);
_uiElement.widget = _panel;
_uiElement.scale = 1 / SCALE;

refObject.addUI(_uiElement);
