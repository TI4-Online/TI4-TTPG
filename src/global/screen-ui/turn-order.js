const { TurnOrderPanel } = require("../../lib/ui/turn-order/turn-order-panel");
const {
    Border,
    HorizontalAlignment,
    ImageButton,
    LayoutBox,
    PlayerPermission,
    ScreenUIElement,
    VerticalAlignment,
    globalEvents,
    refPackageId,
    world,
} = require("../../wrapper/api");

const WIDTH = 220;
const ENTRY_HEIGHT = 58;
const PAD = 14;

const BUTTON_SIZE = 10;

class TurnOrderScreenUI {
    constructor() {
        this._playerSlots = Array.from(Array(20).keys());
        this._playerPermission = new PlayerPermission().setPlayerSlots(
            this._playerSlots
        );

        this._fancyUIs = [this.createFancyUI()];
        this.createToggleUI();

        globalEvents.TI4.onPlayerCountChanged.add((playerCount) => {
            this.resetHeight();
        });
        this.resetHeight();
    }

    resetHeight() {
        for (const ui of this._fancyUIs) {
            ui.height = ENTRY_HEIGHT * world.TI4.config.playerCount + PAD;
            world.updateScreenUI(ui);
        }
    }

    toggle(player) {
        console.log(`TurnOrderScreenUI.toggle "${player.getName()}"`);

        const playerSlot = player.getSlot();
        const index = this._playerSlots.indexOf(playerSlot);
        if (index >= 0) {
            this._playerSlots.splice(index, 1);
        } else {
            this._playerSlots.push(playerSlot);
        }

        this._playerPermission.setPlayerSlots(this._playerSlots);

        for (const ui of this._fancyUIs) {
            world.updateScreenUI(ui);
        }
    }

    createToggleUI() {
        const c = 0.3;
        const button = new ImageButton()
            .setImage("global/ui/white16x16.png", refPackageId)
            .setImageSize(BUTTON_SIZE, BUTTON_SIZE)
            .setTintColor([c, c, c, 1]);
        button.onClicked.add((button, player) => {
            this.toggle(player);
        });

        // Screen UI can be placed and sized with relative values, but that
        // means UI will vary with screen size.  Since we cannot (yet) center
        // a fixed-size element, place a fixed-side box inside another.
        // This is definitely a hack.
        // This goes away when screen UI can be fixed size.
        const imageButtonBorder = 2;
        const right =
            Math.round(PAD + WIDTH / 2 - BUTTON_SIZE / 2) - imageButtonBorder;
        const top = Math.round(PAD - (BUTTON_SIZE * 3) / 4) - imageButtonBorder;
        const buttonBox = new LayoutBox()
            .setPadding(0, right, top, 0)
            .setHorizontalAlignment(HorizontalAlignment.Right)
            .setVerticalAlignment(VerticalAlignment.Top)
            .setChild(button);

        const ui = new ScreenUIElement();
        ui.relativeWidth = true;
        ui.width = 0.2;
        ui.relativeHeight = false;
        ui.height = BUTTON_SIZE + PAD;
        ui.relativePositionX = true;
        ui.positionX = 1 - ui.width;

        ui.relativePositionY = false;
        ui.positionY = 0;

        ui.widget = buttonBox;

        world.addScreenUI(ui);

        return ui;
    }

    /**
     * Turn order list, positioned in upper right slightly offset from screen edge.
     *
     * @returns {ScreenUIElement}
     */
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
        ui.players = this._playerPermission;

        world.addScreenUI(ui);

        return ui;
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
