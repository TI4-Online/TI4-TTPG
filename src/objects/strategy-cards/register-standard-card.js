const locale = require("../../lib/locale");
const {
    onUiClosedClicked,
    RegisterStrategyCardUI,
} = require("./strategy-card");
const { Broadcast } = require("../../lib/broadcast");
const { ColorUtil } = require("../../lib/color/color-util");
const { Button, Color, Text, VerticalBox } = require("../../wrapper/api");

module.exports = function registerStandardCard(
    strategyCardInstance,
    name,
    color
) {
    const onPrimaryClicked = (button, player) => {
        Broadcast.chatAll(
            locale(`strategy_card.${name}.message.primary`, {
                playerName: player.getName(),
            }),
            player.getPlayerColor()
        );
    };
    const onSecondaryClicked = (button, player) => {
        Broadcast.chatAll(
            locale(`strategy_card.${name}.message.secondary`, {
                playerName: player.getName(),
            }),
            player.getPlayerColor()
        );
    };
    const onPassClicked = (button, player) => {
        Broadcast.chatAll(
            locale(`strategy_card.${name}.message.pass`, {
                playerName: player.getName(),
            }),
            player.getPlayerColor()
        );
    };

    const widgetFactory = () => {
        let headerText = new Text()
            .setFontSize(20)
            .setText(locale(`strategy_card.${name}.text`));

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
            .setTextColor(new Color(0.972, 0.317, 0.286))
            .setText(locale("strategy_card.base.button.pass"));
        passButton.onClicked.add(onPassClicked);
        passButton.onClicked.add(onUiClosedClicked);

        let verticalBox = new VerticalBox();
        verticalBox.addChild(headerText);
        verticalBox.addChild(primaryButton);
        verticalBox.addChild(secondaryButton);
        verticalBox.addChild(passButton);

        return verticalBox;
    };

    ColorUtil.validate(color);
    new RegisterStrategyCardUI()
        .setCard(strategyCardInstance)
        .setWidgetFactory(widgetFactory)
        .setHeight(120)
        .setColor(color)
        .register();
};
