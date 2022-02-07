const { onUiClosedClicked, createStragegyCardUi, broadcastMessage } = require("./strategy-card");
const tp = require("../../wrapper/api");
const locale = require("../../lib/locale");

let selections = {};
let activatingPlayer;

function getPlayerSelectionBySlot(player) {
    selections[player.getSlot()] = selections[player.getSlot()] || {
        value: 0,
        primary: false
    };
}

function createUiWidget(card) {
    let verticalBox = new tp.VerticalBox();

    let primaryCheckBox = new tp.CheckBox()
        .setFontSize(10)
        .setText(locale("strategy_card.leadership.text.primary"));
    primaryCheckBox.onCheckStateChanged((checkBox, player, isChecked) => {
        getPlayerSelectionBySlot(player).primary = isChecked;
    });

    verticalBox.addChild(primaryCheckBox);

    verticalBox.addChild(
        new tp.Text()
            .setFontSize(10)
            .setText(locale("strategy_card.leadership.text"))
    )

    let slider = new tp.Slider().setStepSize(1).setMaxValue(10);
    slider.onValueChanged.add((slider, player, value) => {
        getPlayerSelectionBySlot(player).value = value;
    });
    verticalBox.addChild(slider);

    let closeButton = new Button()
        .setFontSize(10)
        .setText(locale("strategy_card.close.button"));

    closeButton.onClicked.add(onUiClosedClicked);
    widget.addChild(closeButton);

    return verticalBox;
}

globalEvents.TI4.onStrategyCardPlayed.add((card, player) => {
    selections = {};
    activatingPlayer = player.getSlot();
    for (const p of world.getAllPlayers()) {
        selections[player.getSlot()] = 0;
    }
    const widget = createUiWidget(card);
    createStragegyCardUi(card, widget);
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
