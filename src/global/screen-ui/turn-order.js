const { TurnOrderPanel } = require("../../lib/ui/turn-order-panel");
const {
    Border,
    HorizontalAlignment,
    LayoutBox,
    ScreenUIElement,
    globalEvents,
    world,
} = require("../../wrapper/api");

let _turnOrderPanel = undefined;
let _ui = undefined;

// TODO XXX DO A LEADERBOARD LIKE UI

/**
 * Leaderboard-like UI:
 *
 * [faction icon] [player name]   [score v]
 * [faction name] [strategy card] [score ^]
 *
 * There is no strikethrough, but we could use a special font for that.
 * Or put in parens?
 */

const initHandler = () => {
    console.log("screen-ui.end-turn.init");

    _turnOrderPanel = new TurnOrderPanel().disableEndTurnButton();
    const innerBox = new LayoutBox()
        .setOverrideWidth(150)
        .setChild(_turnOrderPanel);
    const outerBox = new LayoutBox()
        .setHorizontalAlignment(HorizontalAlignment.Right)
        .setChild(innerBox);

    const v = 0.05;
    const border = new Border().setColor([v, v, v, 1]).setChild(outerBox);

    _ui = new ScreenUIElement();

    // Make x/width relative to screen size, fix y/height in pixels.
    _ui.relativeWidth = true;
    _ui.width = 0.1;

    _ui.relativeHeight = false;
    _ui.height = world.TI4.config.playerCount * 40;

    _ui.relativePositionX = true;
    _ui.positionX = 1 - _ui.width;

    _ui.relativePositionY = true;
    _ui.positionY = 0;

    _ui.widget = outerBox;

    world.addScreenUI(_ui);
};

globalEvents.TI4.onPlayerCountChanged.add((playerCount) => {
    if (_ui) {
        _ui.height = world.TI4.config.playerCount * 40;
        world.updateScreenUI(_ui);
    }
});

if (!world.__isMock) {
    process.nextTick(initHandler);
}
