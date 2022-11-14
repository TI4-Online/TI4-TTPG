const locale = require("../../lib/locale");
const {
    AbstractStrategyCard,
    FONT_SIZE_BODY,
} = require("./abstract-strategy-card");
const { Broadcast } = require("../../lib/broadcast");
const { CommandToken } = require("../../lib/command-token/command-token");
const { ThrottleClickHandler } = require("../../lib/ui/throttle-click-handler");
const { refObject, world, Button, Color } = require("../../wrapper/api");

new AbstractStrategyCard(refObject)
    .setColor(new Color(0.054, 0.45, 0.188))
    .setBodyWidgetFactory((playerDesk, strategyCardObj) => {
        const playerSlot = playerDesk.playerSlot;
        const playerName = world.TI4.getNameByPlayerSlot(playerSlot);
        const msgColor = playerDesk.color;

        const onPrimary1Dock1PdsClicked = (button, player) => {
            Broadcast.chatAll(
                locale(
                    "strategy_card.construction.message.primary_1dock_1pds",
                    {
                        playerName,
                    }
                ),
                msgColor
            );
        };
        const primary1Dock1PdsButton = new Button()
            .setFontSize(FONT_SIZE_BODY)
            .setText(
                locale("strategy_card.construction.button.primary_1dock_1pds")
            );
        primary1Dock1PdsButton.onClicked.add(
            ThrottleClickHandler.wrap(onPrimary1Dock1PdsClicked)
        );

        const onPrimary2PdsClicked = (button, player) => {
            Broadcast.chatAll(
                locale("strategy_card.construction.message.primary_2pds", {
                    playerName,
                }),
                msgColor
            );
        };
        const primary2PdsButton = new Button()
            .setFontSize(FONT_SIZE_BODY)
            .setText(locale("strategy_card.construction.button.primary_2pds"));
        primary2PdsButton.onClicked.add(
            ThrottleClickHandler.wrap(onPrimary2PdsClicked)
        );

        const onSecondary1DockClicked = (button, player) => {
            Broadcast.chatAll(
                locale("strategy_card.construction.message.secondary_1dock", {
                    playerName,
                }),
                msgColor
            );
        };
        const secondary1DockButton = new Button()
            .setFontSize(FONT_SIZE_BODY)
            .setText(
                locale("strategy_card.construction.button.secondary_1dock")
            );
        secondary1DockButton.onClicked.add(
            ThrottleClickHandler.wrap(onSecondary1DockClicked)
        );

        const onSecondary1PdsClicked = (button, player) => {
            Broadcast.chatAll(
                locale("strategy_card.construction.message.secondary_1pds", {
                    playerName,
                }),
                msgColor
            );
        };
        const secondary1PdsButton = new Button()
            .setFontSize(FONT_SIZE_BODY)
            .setText(
                locale("strategy_card.construction.button.secondary_1pds")
            );
        secondary1PdsButton.onClicked.add(
            ThrottleClickHandler.wrap(onSecondary1PdsClicked)
        );

        return [
            primary1Dock1PdsButton,
            primary2PdsButton,
            secondary1DockButton,
            secondary1PdsButton,
        ];
    })
    .addAutomatorButton(
        locale("strategy_card.automator.base.spend_strategy_token"),
        (playerDesk, player) => {
            CommandToken.spendStrategyToken(playerDesk.playerSlot, player);
        }
    );
