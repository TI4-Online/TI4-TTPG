const {
    broadcastMessage,
    onUiClosedClicked,
    registerStrategyCard,
} = require("./strategy-card");
const { Button, Text, VerticalBox } = require("../../wrapper/api");
const locale = require("../../lib/locale");

module.exports = function registerStandardCard(refObject, name, color) {
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

    registerStrategyCard(refObject, widgetFactory, 120, color);
};
