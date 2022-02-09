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

function createUiWidgetFactory() {
    let primaryCheckBox = new CheckBox()
        .setFontSize(10)
        .setText(locale("strategy_card.leadership.text.primary"));
    primaryCheckBox.onCheckStateChanged.add((checkBox, player, isChecked) => {
        getPlayerSelectionBySlot(player).primary = isChecked;
    });
    let slider = new Slider().setStepSize(1).setMaxValue(10);
    slider.onValueChanged.add((slider, player, value) => {
        getPlayerSelectionBySlot(player).value = value;
    });
    let closeButton = new Button()
        .setFontSize(10)
        .setText(locale("strategy_card.close.button"));

    closeButton.onClicked.add(onUiClosedClicked);

    let verticalBox = new VerticalBox();
    verticalBox.addChild(primaryCheckBox);
    verticalBox.addChild(
        new Text()
            .setFontSize(10)
            .setText(locale("strategy_card.leadership.text"))
    );
    verticalBox.addChild(slider);
    verticalBox.addChild(closeButton);

    return verticalBox;
}

globalEvents.TI4.onStrategyCardPlayed.add((card, player) => {
    if (card.getTemplateId() !== "851C062745CD8B4CEEB4BEB3F1057152") {
        return;
    }

    selections = {};
    activatingPlayer = player.getSlot();
    createStrategyCardUi(card, createUiWidgetFactory);
});
globalEvents.TI4.onStrategyCardSelectionDone.add((card, player) => {
    if (card.getTemplateId() !== "851C062745CD8B4CEEB4BEB3F1057152") {
        return;
    }

    let commandTokenCount = getPlayerSelectionBySlot(player).value;
    if (getPlayerSelectionBySlot(player).primary) commandTokenCount += 3;

    const message = locale("strategy_card.leadership.message", {
        playerName: player.getName(),
        commandTokenCount: commandTokenCount,
    });
    broadcastMessage(message, player);
});

refObject.onDestroyed.add((obj) => {
    globalEvents.TI4.onStrategyCardPlayed.remove(onStrategyCardPlayed);
    globalEvents.TI4.onStrategyCardSelectionDone.remove(onStrategyCardDone);
});
