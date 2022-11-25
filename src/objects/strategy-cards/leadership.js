const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const {
    AbstractStrategyCard,
    FONT_SIZE_BODY,
} = require("./abstract-strategy-card");
const { Broadcast } = require("../../lib/broadcast");
const { ThrottleClickHandler } = require("../../lib/ui/throttle-click-handler");
const { WidgetFactory } = require("../../lib/ui/widget-factory");
const { refObject, world, Color } = require("../../wrapper/api");

const selections = {};

function getPlayerSelectionBySlot(slot) {
    assert(typeof slot === "number");
    selections[slot] = selections[slot] || {
        value: 0,
        primary: false,
    };

    return selections[slot];
}

const onStrategyCardSelectionDone = (playerDesk) => {
    assert(playerDesk);

    const playerSlot = playerDesk.playerSlot;
    const playerName = world.TI4.getNameByPlayerSlot(playerSlot);
    const msgColor = playerDesk.color;

    let commandTokenCount = getPlayerSelectionBySlot(playerSlot).value;
    if (getPlayerSelectionBySlot(playerSlot).primary) {
        commandTokenCount += 3;
    }

    const message = locale("strategy_card.leadership.message", {
        playerName,
        commandTokenCount,
    });
    Broadcast.chatAll(message, msgColor);
};

function widgetFactory(playerDesk, strategyCardObj) {
    const playerSlot = playerDesk.playerSlot;
    selections[playerSlot] = {
        value: 0,
        primary: false,
    };

    const primaryCheckBox = WidgetFactory.checkBox()
        .setFontSize(FONT_SIZE_BODY)
        .setText(locale("strategy_card.leadership.text.primary"));
    primaryCheckBox.onCheckStateChanged.add((checkBox, player, isChecked) => {
        getPlayerSelectionBySlot(playerSlot).primary = isChecked;
    });

    const sliderText = WidgetFactory.text()
        .setFontSize(FONT_SIZE_BODY)
        .setText(locale("strategy_card.leadership.slider_text"));
    const slider = WidgetFactory.slider()
        .setFontSize(FONT_SIZE_BODY)
        .setTextBoxWidth(FONT_SIZE_BODY * 3)
        .setStepSize(1)
        .setMaxValue(10);
    slider.onValueChanged.add((slider, player, value) => {
        getPlayerSelectionBySlot(playerSlot).value = value;
    });

    const reportTokensClicked = (button, player) => {
        onStrategyCardSelectionDone(playerDesk);
    };
    const reportTokensButton = WidgetFactory.button()
        .setFontSize(FONT_SIZE_BODY)
        .setText(locale("strategy_card.leadership.button.report"));
    reportTokensButton.onClicked.add(
        ThrottleClickHandler.wrap(reportTokensClicked)
    );

    return [primaryCheckBox, sliderText, slider, reportTokensButton];
}

new AbstractStrategyCard(refObject)
    .setColor(new Color(0.925, 0.109, 0.141))
    .setBodyWidgetFactory(widgetFactory);
