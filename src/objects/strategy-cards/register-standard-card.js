const {
    broadcastMessage,
    onUiClosedClicked,
    RegisterStrategyCardUI,
} = require("./strategy-card");
const { Button, Text, VerticalBox } = require("../../wrapper/api");
const locale = require("../../lib/locale");

module.exports = function registerStandardCard(
    strategyCardInstance,
    name,
    color
) {
    const onPrimaryClicked = (button, player) => {
        broadcastMessage(
            `strategy_card.${name}.message.primary`,
            { playerName: player.getName() },
            player
        );
    };
    const onSecondaryClicked = (button, player) => {
        broadcastMessage(
            `strategy_card.${name}.message.secondary`,
            { playerName: player.getName() },
            player
        );
    };
    const onPassClicked = (button, player) => {
        broadcastMessage(
            `strategy_card.${name}.message.pass`,
            { playerName: player.getName() },
            player
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

    new RegisterStrategyCardUI()
        .setCard(strategyCardInstance)
        .setWidgetFactory(widgetFactory)
        .setHeight(120)
        .setColor(color)
        .register();
};
