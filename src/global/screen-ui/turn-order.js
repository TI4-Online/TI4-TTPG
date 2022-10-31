const { TurnOrderPanel } = require("../../lib/ui/turn-order/turn-order-panel");
const {
    Border,
    HorizontalAlignment,
    LayoutBox,
    ScreenUIElement,
    globalEvents,
    world,
} = require("../../wrapper/api");

const WIDTH = 220;
const ENTRY_HEIGHT = 58;
const FONT_SIZE = ENTRY_HEIGHT * 0.2;
const PAD = 10;

class TurnOrderScreenUI {
    constructor() {
        this._turnOrderPanel = new TurnOrderPanel()
            .setFontSize(FONT_SIZE)
            .setFitNameLength(13)
            .setUseFancyWidgets(true);

        // Screen UI can be placed and sized with relative values, but that
        // means UI will vary with screen size.  Since we cannot (yet) center
        // a fixed-size element, place a fixed-side box inside another.
        // This is definitely a hack.
        // This goes away when screen UI can be fixed size.
        const inner = new LayoutBox()
            .setOverrideWidth(WIDTH)
            .setChild(this._turnOrderPanel);

        const c = 0.3;
        const frame = new Border().setColor([c, c, c, 1]).setChild(inner);

        const outer = new LayoutBox()
            .setHorizontalAlignment(HorizontalAlignment.Right)
            .setPadding(0, PAD, PAD, 0)
            .setChild(frame);

        this._ui = new ScreenUIElement();
        this._ui.relativeWidth = true;
        this._ui.width = 0.2;
        this._ui.relativeHeight = false;
        this._ui.height = ENTRY_HEIGHT * world.TI4.config.playerCount + PAD;
        this._ui.relativePositionX = true;
        this._ui.positionX = 1 - this._ui.width;

        this._ui.relativePositionY = false;
        this._ui.positionY = 0;

        this._ui.widget = outer;

        world.addScreenUI(this._ui);

        globalEvents.TI4.onPlayerCountChanged.add((playerCount) => {
            this._ui.height = ENTRY_HEIGHT * world.TI4.config.playerCount;
            world.updateScreenUI(this._ui);
        });
    }
}

if (!world.__isMock) {
    // Give the world a little time to set up.
    let ticksRemaining = 10;
    const maybeGo = () => {
        if (ticksRemaining-- > 0) {
            process.nextTick(maybeGo);
            return;
        }
        new TurnOrderScreenUI();
    };
    maybeGo();
}
