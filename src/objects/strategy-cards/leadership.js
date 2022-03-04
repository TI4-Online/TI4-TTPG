const {
    onUiClosedClicked,
    RegisterStrategyCardUI,
} = require("./strategy-card");
const {
    Button,
    CheckBox,
    Color,
    Slider,
    Text,
    VerticalBox,
    refObject,
} = require("../../wrapper/api");
const { Broadcast } = require("../../lib/broadcast");
const locale = require("../../lib/locale");
const assert = require("../../wrapper/assert-wrapper");

let selections = {};

function getPlayerSelectionBySlot(slot) {
    assert(typeof slot === "number");
    selections[slot] = selections[slot] || {
        value: 0,
        primary: false,
    };

    return selections[slot];
}

function widgetFactory(playerDesk, packageId) {
    let headerText = new Text()
        .setFontSize(20)
        .setText(locale("strategy_card.leadership.text"));
    let primaryCheckBox = new CheckBox()
        .setFontSize(10)
        .setText(locale("strategy_card.leadership.text.primary"));
    primaryCheckBox.onCheckStateChanged.add((checkBox, player, isChecked) => {
        getPlayerSelectionBySlot(playerDesk.playerSlot).primary = isChecked;
    });
    let slider = new Slider().setStepSize(1).setMaxValue(10);
    slider.onValueChanged.add((slider, player, value) => {
        getPlayerSelectionBySlot(playerDesk.playerSlot).value = value;
    });
    let closeButton = new Button()
        .setFontSize(10)
        .setText(locale("strategy_card.base.button.close"));

    closeButton.onClicked.add(onUiClosedClicked);

    let verticalBox = new VerticalBox();
    verticalBox.addChild(headerText);
    verticalBox.addChild(primaryCheckBox);
    verticalBox.addChild(
        new Text()
            .setFontSize(10)
            .setText(locale("strategy_card.leadership.slider_text"))
    );
    verticalBox.addChild(slider);
    verticalBox.addChild(closeButton);

    return verticalBox;
}

const onStrategyCardPlayed = (card, player) => {
    selections = {};
};

const onStrategyCardSelectionDone = (card, player, owningPlayerSlot) => {
    assert(typeof owningPlayerSlot === "number");
    let commandTokenCount = getPlayerSelectionBySlot(owningPlayerSlot).value;
    if (getPlayerSelectionBySlot(owningPlayerSlot).primary)
        commandTokenCount += 3;

    const message = locale("strategy_card.leadership.message", {
        playerName: player.getName(),
        commandTokenCount: commandTokenCount,
    });
    Broadcast.chatAll(message, player.getPlayerColor());
};

new RegisterStrategyCardUI()
    .setCard(refObject)
    .setWidgetFactory(widgetFactory)
    .setHeight(125)
    .setColor(new Color(0.925, 0.109, 0.141))
    .setOnStrategyCardPlayed(onStrategyCardPlayed)
    .setOnStrategyCardSelectionDone(onStrategyCardSelectionDone)
    .register();
