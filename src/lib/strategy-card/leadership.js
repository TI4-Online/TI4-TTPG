const {
    onUiClosedClicked,
    createStrategyCardUi,
    broadcastMessage,
} = require("./strategy-card");
const {
    globalEvents,
    Button,
    CheckBox,
    Slider,
    Text,
    VerticalBox,
} = require("../../wrapper/api");
const locale = require("../../lib/locale");

let selections = {};
let activatingPlayer;

function getPlayerSelectionBySlot(player) {
    const slot = player.getSlot();
    selections[slot] = selections[slot] || {
        value: 0,
        primary: false,
    };

    return selections[slot];
}

function createUiWidget() {
    let verticalBox = new VerticalBox();

    let primaryCheckBox = new CheckBox()
        .setFontSize(10)
        .setText(locale("strategy_card.leadership.text.primary"));
    primaryCheckBox.onCheckStateChanged.add((checkBox, player, isChecked) => {
        getPlayerSelectionBySlot(player).primary = isChecked;
    });

    verticalBox.addChild(primaryCheckBox);

    verticalBox.addChild(
        new Text()
            .setFontSize(10)
            .setText(locale("strategy_card.leadership.text"))
    );

    let slider = new Slider().setStepSize(1).setMaxValue(10);
    slider.onValueChanged.add((slider, player, value) => {
        getPlayerSelectionBySlot(player).value = value;
    });
    verticalBox.addChild(slider);

    let closeButton = new Button()
        .setFontSize(10)
        .setText(locale("strategy_card.close.button"));

    closeButton.onClicked.add(onUiClosedClicked);
    verticalBox.addChild(closeButton);

    return verticalBox;
}

globalEvents.TI4.onStrategyCardPlayed.add((card, player) => {
    selections = {};
    activatingPlayer = player.getSlot();
    const widget = createUiWidget(card);
    createStrategyCardUi(card, widget);
});

globalEvents.TI4.onStrategyCardSelectionDone.add((card, player) => {
    let commandTokenCount = getPlayerSelectionBySlot(player).value;
    if (getPlayerSelectionBySlot(player).primary) commandTokenCount += 3;

    const message = locale("strategy_card.leadership.message", {
        playerName: player.getName(),
        commandTokenCount: commandTokenCount,
    });
    broadcastMessage(message, player);
});
