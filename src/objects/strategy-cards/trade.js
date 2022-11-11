const locale = require("../../lib/locale");
const {
    AbstractStrategyCard,
    FONT_SIZE_BODY,
    SCALE,
} = require("./abstract-strategy-card");
const { Broadcast } = require("../../lib/broadcast");
const { ThrottleClickHandler } = require("../../lib/ui/throttle-click-handler");
const {
    refObject,
    world,
    Border,
    Button,
    Color,
    LayoutBox,
    Text,
    VerticalBox,
} = require("../../wrapper/api");

const onAllowReplenishClicked = (button, player) => {
    const playerSlot = player.getSlot();
    const playerName = world.TI4.getNameByPlayerSlot(playerSlot);
    Broadcast.chatAll(
        locale("strategy_card.trade.message.allow_replenish", {
            playerName,
            targetPlayerName: button.getText(),
        }),
        player.getPlayerColor()
    );
};

const addReplenishPlayersSection = (owningPlayerDesk, verticalBox) => {
    const replenishBox = new VerticalBox();

    const p = 8 * SCALE;
    const padded = new LayoutBox()
        .setPadding(p, p, p / 2, p)
        .setChild(replenishBox);
    const border = new Border().setChild(padded);
    verticalBox.addChild(border);

    replenishBox.addChild(
        new Text()
            .setText(locale("strategy_card.trade.text.allowReplenish"))
            .setFontSize(FONT_SIZE_BODY)
    );

    world.TI4.getAllPlayerDesks().forEach((playerDesk) => {
        // no button for the player itself
        if (playerDesk === owningPlayerDesk) return;

        const deskOwningPlayer = world.getAllPlayers().find((p) => {
            p.getSlot() === playerDesk.playerSlot;
        });

        let primaryAllowReplenishButton = new Button()
            .setFontSize(FONT_SIZE_BODY)
            .setText(deskOwningPlayer || playerDesk.colorName) // in case the player is currently not seated
            .setTextColor(playerDesk.color);
        primaryAllowReplenishButton.onClicked.add(
            ThrottleClickHandler.wrap(onAllowReplenishClicked)
        );
        replenishBox.addChild(primaryAllowReplenishButton);
    });
};

const widgetFactory = (verticalBox, playerDesk) => {
    const playerSlot = playerDesk.playerSlot;
    const playerName = world.TI4.getNameByPlayerSlot(playerSlot);
    const msgColor = playerDesk.color;
    const cardName = locale("strategy_card.trade.text");

    const onPrimaryClicked = (button, player) => {
        Broadcast.chatAll(
            locale(`strategy_card.base.message.primary`, {
                playerName,
                cardName,
            }),
            msgColor
        );
    };
    const primaryButton = new Button()
        .setFontSize(FONT_SIZE_BODY)
        .setText(locale("strategy_card.base.button.primary"));
    primaryButton.onClicked.add(ThrottleClickHandler.wrap(onPrimaryClicked));
    verticalBox.addChild(primaryButton);

    addReplenishPlayersSection(playerDesk, verticalBox);

    const onSecondaryClicked = (button, player) => {
        Broadcast.chatAll(
            locale(`strategy_card.base.message.secondary`, {
                playerName,
                cardName,
            }),
            msgColor
        );
    };
    const secondaryButton = new Button()
        .setFontSize(FONT_SIZE_BODY)
        .setText(locale("strategy_card.base.button.secondary"));
    secondaryButton.onClicked.add(
        ThrottleClickHandler.wrap(onSecondaryClicked)
    );
    verticalBox.addChild(secondaryButton);
};

new AbstractStrategyCard(refObject)
    .setColor(new Color(0, 0.486, 0.435))
    .setBodyWidgetFactory(widgetFactory);
