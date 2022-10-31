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
const PAD = 10;

class TurnOrderScreenUI {
    constructor() {
        this._fancyUIs = [this.createFancyUI()];

        globalEvents.TI4.onPlayerCountChanged.add((playerCount) => {
            this.resetHeight();
        });
        this.resetHeight();
    }

    createFancyUI() {
        // Fancy hard codes font sizes and fit lengths.
        const turnOrderPanel = new TurnOrderPanel().setUseFancyWidgets(true);

        // Screen UI can be placed and sized with relative values, but that
        // means UI will vary with screen size.  Since we cannot (yet) center
        // a fixed-size element, place a fixed-side box inside another.
        // This is definitely a hack.
        // This goes away when screen UI can be fixed size.
        const inner = new LayoutBox()
            .setOverrideWidth(WIDTH)
            .setChild(turnOrderPanel);

        const c = 0.3;
        const frame = new Border().setColor([c, c, c, 1]).setChild(inner);

        const outer = new LayoutBox()
            .setHorizontalAlignment(HorizontalAlignment.Right)
            .setPadding(0, PAD, PAD, 0)
            .setChild(frame);

        const ui = new ScreenUIElement();
        ui.relativeWidth = true;
        ui.width = 0.2;
        ui.relativeHeight = false;
        ui.height = 0; // call resetHeight to set
        ui.relativePositionX = true;
        ui.positionX = 1 - ui.width;

        ui.relativePositionY = false;
        ui.positionY = 0;

        ui.widget = outer;

        world.addScreenUI(ui);

        return ui;
    }

    resetHeight() {
        for (const ui of this._fancyUIs) {
            ui.height = ENTRY_HEIGHT * world.TI4.config.playerCount + PAD;
            world.updateScreenUI(ui);
        }
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
