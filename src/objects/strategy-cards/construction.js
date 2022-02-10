const {
    broadcastMessage,
    onUiClosedClicked,
    registerStrategyCard,
} = require("./strategy-card");
const { Button, Text, VerticalBox, refObject } = require("../../wrapper/api");
const locale = require("../../lib/locale");

const onPrimary1Dock1PdsClicked = (button, player) => {
    broadcastMessage(
        "strategy_card.construction.message.primary-1dock-1pds",
        { playerName: player.getName() },
        player
    );
};
const onPrimary2PdsClicked = (button, player) => {
    broadcastMessage(
        "strategy_card.construction.message.primary-2pds",
        { playerName: player.getName() },
        player
    );
};
const onSecondary1DockClicked = (button, player) => {
    broadcastMessage(
        "strategy_card.construction.message.secondary-1dock",
        { playerName: player.getName() },
        player
    );
};
const onSecondary1PdsClicked = (button, player) => {
    broadcastMessage(
        "strategy_card.construction.message.secondary-1pds",
        { playerName: player.getName() },
        player
    );
};
const onPassClicked = (button, player) => {
    broadcastMessage(
        "strategy_card.construction.message.pass",
        { playerName: player.getName() },
        player
    );
};

const widgetFactory = () => {
    let headerText = new Text()
        .setFontSize(10)
        .setText(locale("strategy_card.construction.text"));

    let primary1Dock1PdsButton = new Button()
        .setFontSize(10)
        .setText(
            locale("strategy_card.construction.button.primary-1dock-1pds")
        );
    primary1Dock1PdsButton.onClicked.add(onPrimary1Dock1PdsClicked);
    primary1Dock1PdsButton.onClicked.add(onUiClosedClicked);

    let primary2PdsButton = new Button()
        .setFontSize(10)
        .setText(locale("strategy_card.construction.button.primary-2pds"));
    primary2PdsButton.onClicked.add(onPrimary2PdsClicked);
    primary2PdsButton.onClicked.add(onUiClosedClicked);

    let secondary1DockButton = new Button()
        .setFontSize(10)
        .setText(locale("strategy_card.construction.button.secondary-1dock"));
    secondary1DockButton.onClicked.add(onSecondary1DockClicked);
    secondary1DockButton.onClicked.add(onUiClosedClicked);

    let secondary1PdsButton = new Button()
        .setFontSize(10)
        .setText(locale("strategy_card.construction.button.secondary-1pds"));
    secondary1PdsButton.onClicked.add(onSecondary1PdsClicked);
    secondary1PdsButton.onClicked.add(onUiClosedClicked);

    let passButton = new Button()
        .setFontSize(10)
        .setText(locale("strategy_card.base.button.pass"));
    passButton.onClicked.add(onPassClicked);
    passButton.onClicked.add(onUiClosedClicked);

    let verticalBox = new VerticalBox();
    verticalBox.addChild(headerText);
    verticalBox.addChild(primary1Dock1PdsButton);
    verticalBox.addChild(primary2PdsButton);
    verticalBox.addChild(secondary1DockButton);
    verticalBox.addChild(secondary1PdsButton);
    verticalBox.addChild(passButton);

    return verticalBox;
};

registerStrategyCard(refObject, widgetFactory);
