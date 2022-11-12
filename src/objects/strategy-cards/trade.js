const locale = require("../../lib/locale");
const {
    AbstractStrategyCard,
    FONT_SIZE_BODY,
    SCALE,
    SPACING,
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

const createReplenishPlayersSection = (owningPlayerDesk) => {
    const replenishBox = new VerticalBox().setChildDistance(SPACING);

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

    const p = 8 * SCALE;
    const padded = new LayoutBox()
        .setPadding(p, p, p / 2, p)
        .setChild(replenishBox);
    const border = new Border().setChild(padded);
    return border;
};

const widgetFactory = (playerDesk, strategyCardObj) => {
    const primaryButton = AbstractStrategyCard.createButtonPlayPrimary(
        playerDesk,
        strategyCardObj
    );

    const replenishBox = createReplenishPlayersSection(playerDesk);

    const secondaryButton = AbstractStrategyCard.createButtonPlaySecondary(
        playerDesk,
        strategyCardObj
    );

    return [primaryButton, replenishBox, secondaryButton];
};

new AbstractStrategyCard(refObject)
    .setColor(new Color(0, 0.486, 0.435))
    .setBodyWidgetFactory(widgetFactory);
