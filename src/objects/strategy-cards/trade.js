const {
    broadcastMessage,
    onUiClosedClicked,
    RegisterStrategyCardUI,
} = require("./strategy-card");
const {
    Border,
    Button,
    Color,
    Text,
    VerticalBox,
    refObject,
} = require("../../wrapper/api");
const { PlayerDesk } = require("../../lib/player-desk");
const locale = require("../../lib/locale");

const onPrimaryClicked = (button, player) => {
    broadcastMessage(
        "strategy_card.trade.message.primary",
        { playerName: player.getName() },
        player
    );
};
const onAllowReplenishClicked = (button, player) => {
    broadcastMessage(
        "strategy_card.construction.message.allow_replenish",
        {
            playerName: player.getName(),
            targetPlayerName: button.getText(),
        },
        player
    );
};
const onSecondaryClicked = (button, player) => {
    broadcastMessage(
        "strategy_card.trade.message.secondary",
        { playerName: player.getName() },
        player
    );
};
const onPassClicked = (button, player) => {
    broadcastMessage(
        "strategy_card.trade.message.pass",
        { playerName: player.getName() },
        player
    );
};

const addReplenishPlayersSection = (owningPlayerDesk, verticalBox) => {
    let replenishBorder = new Border();
    verticalBox.addChild(replenishBorder);
    let replenishBox = new VerticalBox();
    replenishBorder.setChild(replenishBox);

    replenishBox.addChild(
        new Text()
            .setText(locale("strategy_card.trade.text.allowReplenish"))
            .setFontSize(10)
    );

    PlayerDesk.getPlayerDesks().forEach((playerDesk) => {
        // no button for the player itself
        if (playerDesk === owningPlayerDesk) return;

        const deskOwningPlayer = world.getAllPlayers().find((p) => {
            p.getSlot() === playerDesk.playerSlot;
        });

        let primaryAllowReplenishButton = new Button()
            .setFontSize(10)
            .setText(deskOwningPlayer || playerDesk.colorName) // in case the player is currently not seated
            .setTextColor(playerDesk.color);
        primaryAllowReplenishButton.onClicked.add(onAllowReplenishClicked);
        primaryAllowReplenishButton.onClicked.add(onUiClosedClicked);
        replenishBox.addChild(primaryAllowReplenishButton);
    });
};

const widgetFactory = (playerDesk) => {
    let headerText = new Text()
        .setFontSize(20)
        .setText(locale("strategy_card.trade.headerText"));

    let primaryButton = new Button()
        .setFontSize(10)
        .setText(locale("strategy_card.base.button.primary"));
    primaryButton.onClicked.add(onPrimaryClicked);
    primaryButton.onClicked.add(onUiClosedClicked);

    let secondaryButton = new Button()
        .setFontSize(10)
        .setText(locale("strategy_card.base.button.secondary"));
    secondaryButton.onClicked.add(onSecondaryClicked);
    secondaryButton.onClicked.add(onUiClosedClicked);

    let passButton = new Button()
        .setFontSize(10)
        .setText(locale("strategy_card.base.button.pass"));
    passButton.onClicked.add(onPassClicked);
    passButton.onClicked.add(onUiClosedClicked);

    let verticalBox = new VerticalBox();
    verticalBox.addChild(headerText);
    verticalBox.addChild(primaryButton);
    addReplenishPlayersSection(playerDesk, verticalBox);
    verticalBox.addChild(secondaryButton);
    verticalBox.addChild(passButton);

    return verticalBox;
};

const calculateHeight = () => {
    return 125 + (PlayerDesk.getPlayerCount() - 1) * 30;
};

new RegisterStrategyCardUI()
    .setCard(refObject)
    .setWidgetFactory(widgetFactory)
    .setHeight(calculateHeight) // variable height by player count
    .setColor(new Color(0.054, 0.45, 0.188))
    .register();
