const strategyCard = require("./strategyCard");
const tp = require("@tabletop-playground/api");
const { refObject } = require("@tabletop-playground/api");

let selections = {};
let activatingPlayer;

function createUiWidget(card, withPrimaryText) {
    let verticalBox = new tp.VerticalBox();

    if (withPrimaryText) {
        verticalBox.addChild(
            new tp.Text()
                .setFontSize(10)
                .setText("You gain 3 command token from the primary ability.")
        );
    }

    verticalBox.addChild(
        new tp.Text()
            .setFontSize(10)
            .setText("Choose the ammount of tokens gained with influence.")
    );

    let slider = new tp.Slider().setStepSize(1).setMaxValue(10);
    slider.onValueChanged.add((slider, player, value) => {
        selections[player.getSlot()] = value;
    });
    verticalBox.addChild(slider);

    return verticalBox;
}

globalEvents.TI4.onStrategyCardSelectionDone.add((card, player) => {
    const playerSlot = player.getSlot();
    let commandTokenCount = selections[playerSlot];
    if (activatingPlayer === playerSlot) commandTokenCount += 3;

    const message = `${player.getName()} gained ${commandTokenCount} command tokens.`;
    console.log(message);
    strategyCard.broadcastMessage(message, player);
});

globalEvents.TI4.onStrategyCardPlayed.add((card, player) => {
    selection = {};
    activatingPlayer = player.getSlot();
    for (const p of world.getAllPlayers()) {
        selections[player.getSlot()] = 0;
    }
    const widget = createUiWidget(card, player);
    const primartyWidget = createUiWidget(card, player, true);
    strategyCard.createStragegyCardUi(widget, primartyWidget, player);
});
