const locale = require("../../lib/locale");
const {
    AbstractStrategyCard,
    FONT_SIZE_BODY,
    SCALE,
    SPACING,
} = require("./abstract-strategy-card");
const { Broadcast } = require("../../lib/broadcast");
const { CommandToken } = require("../../lib/command-token/command-token");
const { ThrottleClickHandler } = require("../../lib/ui/throttle-click-handler");
const { WidgetFactory } = require("../../lib/ui/widget-factory");
const { refObject, world, Color } = require("../../wrapper/api");

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
    const replenishBox = WidgetFactory.verticalBox().setChildDistance(SPACING);

    replenishBox.addChild(
        WidgetFactory.text()
            .setText(locale("strategy_card.trade.text.allowReplenish"))
            .setFontSize(FONT_SIZE_BODY)
    );

    world.TI4.getAllPlayerDesks().forEach((playerDesk) => {
        // no button for the player itself
        if (playerDesk === owningPlayerDesk) return;

        const deskOwningPlayer = world.getAllPlayers().find((p) => {
            p.getSlot() === playerDesk.playerSlot;
        });

        let primaryAllowReplenishButton = WidgetFactory.button()
            .setFontSize(FONT_SIZE_BODY)
            .setText(deskOwningPlayer || playerDesk.colorName) // in case the player is currently not seated
            .setTextColor(playerDesk.color);
        primaryAllowReplenishButton.onClicked.add(
            ThrottleClickHandler.wrap(onAllowReplenishClicked)
        );
        replenishBox.addChild(primaryAllowReplenishButton);
    });

    const p = 8 * SCALE;
    const padded = WidgetFactory.layoutBox()
        .setPadding(p, p, p / 2, p)
        .setChild(replenishBox);
    const border = WidgetFactory.border().setChild(padded);
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
    .setBodyWidgetFactory(widgetFactory)
    .addAutomatorButton(
        locale("strategy_card.automator.base.spend_strategy_token"),
        (playerDesk, player) => {
            CommandToken.spendStrategyToken(playerDesk.playerSlot, player);
        }
    );
