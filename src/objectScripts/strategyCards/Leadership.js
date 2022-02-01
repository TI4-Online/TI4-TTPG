const base = require("./strategyCardBase");
const tp = require('@tabletop-playground/api');
const { refObject } = require('@tabletop-playground/api');

refObject.onCreated.add(base.setupStrategyCard);

function createUiWidget(withPrimaryText) {
    let verticalBox = new tp.VerticalBox();

    if (withPrimaryText) {
        verticalBox.addChild(new tp.Text().setFontSize(10).setText("You gain 3 command token from the primary ability."));
    }

    verticalBox.addChild(new tp.Text().setFontSize(10).setText("Choose the ammount of tokens gained with influence."));

    let slider = new tp.Slider()
        .setStepSize(1)
        .setMaxValue(10);
    verticalBox.addChild(slider);

    return verticalBox;
}

refObject.onCloseDialog = function(closingPlayer) {
    if (closingPlayer.getSlot() === refObject.getOwningPlayerSlot()) {
        const commandTokenCount = slider.getValue() + (closingPlayer === player ? 3 : 0);
        const message = `${closingPlayer.getName()} gained ${commandTokenCount} command tokens.`;
        base.broadcastMessage(message, closingPlayer);
    }
};

refObject.onPlay = function (player) {
    const widget = createUiWidget(player);
    const primartyWidget = createUiWidget(player, true);
    base.createStragegyCardUi(widget, primartyWidget, player);
};
