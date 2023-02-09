const locale = require("../../lib/locale");
const { ThrottleClickHandler } = require("../../lib/ui/throttle-click-handler");
const {
    Border,
    Button,
    HorizontalAlignment,
    LayoutBox,
    PlayerPermission,
    ScreenUIElement,
    globalEvents,
    world,
} = require("../../wrapper/api");

const WIDTH = 225;
const HEIGHT = 60;
const FONT_SIZE = HEIGHT * 0.3;
const SCREEN_X = 50; // top of widget
const BORDER_SIZE = 2;

class EndTurnScreenUI {
    constructor() {
        this._button = new Button()
            .setFontSize(FONT_SIZE)
            .setBold(true)
            .setText(locale("ui.button.end_turn"));
        this._button.onClicked.add(
            ThrottleClickHandler.wrap((button, clickingPlayer) => {
                console.log("endTurnButton.onClicked");
                if (world.TI4.turns.isActivePlayer(clickingPlayer)) {
                    world.TI4.turns.endTurn(clickingPlayer);
                }
            })
        );

        // Wrap button in a colored border.
        const buttonBox = new LayoutBox()
            .setPadding(BORDER_SIZE, BORDER_SIZE, BORDER_SIZE, BORDER_SIZE)
            .setChild(this._button);
        this._border = new Border().setColor([1, 1, 1, 1]).setChild(buttonBox);

        // Then wrap in an outer border.  This is "the widget" to show.
        const outerBorderBox = new LayoutBox()
            .setPadding(BORDER_SIZE, BORDER_SIZE, BORDER_SIZE, BORDER_SIZE)
            .setChild(this._border);
        const c = 0.02;
        const outerBorder = new Border()
            .setColor([c, c, c, 1])
            .setChild(outerBorderBox);

        // Screen UI can be placed and sized with relative values, but that
        // means UI will vary with screen size.  Since we cannot (yet) center
        // a fixed-size element, place a fixed-side box inside another.
        // This is definitely a hack.
        // This goes away when screen UI can be fixed size.
        const inner = new LayoutBox()
            .setOverrideWidth(WIDTH)
            .setChild(outerBorder);

        const outer = new LayoutBox()
            .setHorizontalAlignment(HorizontalAlignment.Center)
            .setChild(inner);

        this._ui = new ScreenUIElement();
        this._ui.relativeWidth = true;
        this._ui.width = 0.1; // if too small the WIDTH is reduced
        this._ui.relativeHeight = false;
        this._ui.height = HEIGHT;
        this._ui.relativePositionX = true;
        this._ui.positionX = (1 - this._ui.width) / 2;
        this._ui.relativePositionY = false;
        this._ui.positionY = SCREEN_X;
        this._ui.widget = outer;

        world.addScreenUI(this._ui);

        // Auto-update.
        const updateHandler = () => {
            this.update();
        };
        globalEvents.TI4.onTurnChanged.add(updateHandler);
        globalEvents.TI4.onTurnOrderChanged.add(updateHandler);
        globalEvents.TI4.onTurnOrderEmpty.add(updateHandler);
        globalEvents.onPlayerSwitchedSlots.add(updateHandler);

        this.update();
    }

    update() {
        const currentDesk = world.TI4.turns.getCurrentTurn();
        this._button.setTextColor(currentDesk.widgetColor);
        this._border.setColor(currentDesk.widgetColor);

        // Only the active turn player can see it.
        const playerSlots = currentDesk ? [currentDesk.playerSlot] : [];
        const playerPermission = new PlayerPermission().setPlayerSlots(
            playerSlots
        );
        this._ui.players = playerPermission;
        world.updateScreenUI(this._ui);
    }
}

if (!world.__isMock) {
    process.nextTick(() => {
        new EndTurnScreenUI();
    });
}
