const {
    onUiClosedClicked,
    createStrategyCardUi,
    broadcastMessage,
} = require("./strategy-card");
const {
    globalEvents,
    Button,
    Text,
    VerticalBox,
} = require("../../wrapper/api");
const locale = require("../../lib/locale");

function onPrimaryClicked(button, player) {
    const message = locale("strategy_card.diplomacy.message.primary", {
        playerName: player.getName()
    });
    broadcastMessage(message, player);
}

function onSecondaryClicked(button, player) {
    const message = locale("strategy_card.diplomacy.message.secondary", {
        playerName: player.getName()
    });
    broadcastMessage(message, player);
}

function onPassClicked(button, player) {
    const message = locale("strategy_card.diplomacy.message.pass", {
        playerName: player.getName()
    });
    broadcastMessage(message, player);
}

function createUiWidgetFactory() {
    let verticalBox = new VerticalBox();
    verticalBox.addChild(
        new Text()
            .setFontSize(10)
            .setText(locale("strategy_card.diplomacy.text"))
    );

    let primaryButton = new Button()
        .setFontSize(10)
        .setText(locale("strategy_card.base.button.primary"));
    primaryButton.onClicked.add(onPrimaryClicked);
    primaryButton.onClicked.add(onUiClosedClicked);
    verticalBox.addChild(primaryButton);
    let secondaryButton = new Button()
        .setFontSize(10)
        .setText(locale("strategy_card.base.button.secondary"));

    secondaryButton.onClicked.add(onSecondaryClicked);
    secondaryButton.onClicked.add(onUiClosedClicked);
    verticalBox.addChild(secondaryButton);
    let passButton = new Button()
        .setFontSize(10)
        .setText(locale("strategy_card.base.button.pass"));

    passButton.onClicked.add(onPassClicked);
    passButton.onClicked.add(onUiClosedClicked);
    verticalBox.addChild(passButton);

    return verticalBox;
}

globalEvents.TI4.onStrategyCardPlayed.add((card) => {
    if (card.getName() !== "Diplomacy") {
        return;
    }

    createStrategyCardUi(card, createUiWidgetFactory);
});
