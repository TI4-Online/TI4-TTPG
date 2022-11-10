const locale = require("../../lib/locale");
const {
    AbstractStrategyCard,
    FONT_SIZE_BODY,
} = require("./abstract-strategy-card");
const { Broadcast } = require("../../lib/broadcast");
const { refObject, Button, Color } = require("../../wrapper/api");

new AbstractStrategyCard(refObject)
    .setColor(new Color(0.054, 0.45, 0.188))
    .setBodyWidgetFactory((verticalBox, playerDesk, closeHandler) => {
        const onPrimary1Dock1PdsClicked = (button, player) => {
            Broadcast.chatAll(
                locale(
                    "strategy_card.construction.message.primary_1dock_1pds",
                    {
                        playerName: player.getName(),
                    }
                ),
                player.getPlayerColor()
            );
        };
        const primary1Dock1PdsButton = new Button()
            .setFontSize(FONT_SIZE_BODY)
            .setText(
                locale("strategy_card.construction.button.primary_1dock_1pds")
            );
        primary1Dock1PdsButton.onClicked.add(onPrimary1Dock1PdsClicked);
        primary1Dock1PdsButton.onClicked.add(closeHandler);

        const onPrimary2PdsClicked = (button, player) => {
            Broadcast.chatAll(
                locale("strategy_card.construction.message.primary_2pds", {
                    playerName: player.getName(),
                }),
                player.getPlayerColor()
            );
        };
        const primary2PdsButton = new Button()
            .setFontSize(FONT_SIZE_BODY)
            .setText(locale("strategy_card.construction.button.primary_2pds"));
        primary2PdsButton.onClicked.add(onPrimary2PdsClicked);
        primary2PdsButton.onClicked.add(closeHandler);

        const onSecondary1DockClicked = (button, player) => {
            Broadcast.chatAll(
                locale("strategy_card.construction.message.secondary_1dock", {
                    playerName: player.getName(),
                }),
                player.getPlayerColor()
            );
        };
        const secondary1DockButton = new Button()
            .setFontSize(FONT_SIZE_BODY)
            .setText(
                locale("strategy_card.construction.button.secondary_1dock")
            );
        secondary1DockButton.onClicked.add(onSecondary1DockClicked);
        secondary1DockButton.onClicked.add(closeHandler);

        const onSecondary1PdsClicked = (button, player) => {
            Broadcast.chatAll(
                locale("strategy_card.construction.message.secondary_1pds", {
                    playerName: player.getName(),
                }),
                player.getPlayerColor()
            );
        };
        const secondary1PdsButton = new Button()
            .setFontSize(FONT_SIZE_BODY)
            .setText(
                locale("strategy_card.construction.button.secondary_1pds")
            );
        secondary1PdsButton.onClicked.add(onSecondary1PdsClicked);
        secondary1PdsButton.onClicked.add(closeHandler);

        verticalBox.addChild(primary1Dock1PdsButton);
        verticalBox.addChild(primary2PdsButton);
        verticalBox.addChild(secondary1DockButton);
        verticalBox.addChild(secondary1PdsButton);
    });
