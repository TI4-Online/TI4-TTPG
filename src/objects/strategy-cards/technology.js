const {
    broadcastMessage,
    onUiClosedClicked,
    RegisterStrategyCardUI,
} = require("./strategy-card");
const {
    Button,
    Color,
    Text,
    VerticalBox,
    refObject,
} = require("../../wrapper/api");
const locale = require("../../lib/locale");

let selections = {};
let activatingPlayer;

function widgetFactory() {
    let headerText = new Text()
        .setFontSize(20)
        .setText(locale("strategy_card.technology.text"));
    let closeButton = new Button()
        .setFontSize(10)
        .setText(locale("strategy_card.base.button.close"));

    closeButton.onClicked.add(onUiClosedClicked);

    let verticalBox = new VerticalBox();
    verticalBox.addChild(headerText);
    verticalBox.addChild(closeButton);

    return verticalBox;
}

const onStrategyCardPlayed = (card, player) => {};

const onStrategyCardSelectionDone = (card, player) => {};

new RegisterStrategyCardUI()
    .setCard(refObject)
    .setWidgetFactory(widgetFactory)
    .setHeight(71)
    .setColor(new Color(0.027, 0.203, 0.466))
    .setOnStrategyCardPlayed(onStrategyCardPlayed)
    .setOnStrategyCardSelectionDone(onStrategyCardSelectionDone)
    .register();
