const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const {
    AbstractStrategyCard,
    FONT_SIZE_BODY,
} = require("./abstract-strategy-card");
const { Broadcast } = require("../../lib/broadcast");
const {
    refObject,
    Button,
    CheckBox,
    Color,
    Player,
    Slider,
    Text,
} = require("../../wrapper/api");

const selections = {};

function getPlayerSelectionBySlot(slot) {
    assert(typeof slot === "number");
    selections[slot] = selections[slot] || {
        value: 0,
        primary: false,
    };

    return selections[slot];
}

const onStrategyCardSelectionDone = (card, player, owningPlayerSlot) => {
    assert(player instanceof Player);
    assert(typeof owningPlayerSlot === "number");

    let commandTokenCount = getPlayerSelectionBySlot(owningPlayerSlot).value;
    if (getPlayerSelectionBySlot(owningPlayerSlot).primary) {
        commandTokenCount += 3;
    }

    const message = locale("strategy_card.leadership.message", {
        playerName: player.getName(),
        commandTokenCount: commandTokenCount,
    });
    Broadcast.chatAll(message, player.getPlayerColor());
};

function widgetFactory(verticalBox, playerDesk, closeHandler) {
    const playerSlot = playerDesk.playerSlot;
    selections[playerSlot] = {
        value: 0,
        primary: false,
    };

    const primaryCheckBox = new CheckBox()
        .setFontSize(FONT_SIZE_BODY)
        .setText(locale("strategy_card.leadership.text.primary"));
    primaryCheckBox.onCheckStateChanged.add((checkBox, player, isChecked) => {
        getPlayerSelectionBySlot(playerSlot).primary = isChecked;
    });
    const slider = new Slider()
        .setFontSize(FONT_SIZE_BODY)
        .setTextBoxWidth(FONT_SIZE_BODY * 3)
        .setStepSize(1)
        .setMaxValue(10);
    slider.onValueChanged.add((slider, player, value) => {
        getPlayerSelectionBySlot(playerSlot).value = value;
    });
    const gainTokensButton = new Button()
        .setFontSize(FONT_SIZE_BODY)
        .setText(locale("strategy_card.leadership.button.gain"));
    gainTokensButton.onClicked.add((button, player) => {
        onStrategyCardSelectionDone(refObject, player, playerSlot);
    });
    gainTokensButton.onClicked.add(closeHandler);

    verticalBox.addChild(primaryCheckBox);
    verticalBox.addChild(
        new Text()
            .setFontSize(FONT_SIZE_BODY)
            .setText(locale("strategy_card.leadership.slider_text"))
    );
    verticalBox.addChild(slider);
    verticalBox.addChild(gainTokensButton);

    return verticalBox;
}

new AbstractStrategyCard(refObject)
    .setColor(new Color(0.925, 0.109, 0.141))
    .setBodyWidgetFactory(widgetFactory);
