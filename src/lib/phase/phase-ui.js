const assert = require("../../wrapper/assert-wrapper");
const locale = require("../locale");
const { DealActionCards, EndStatusPhase } = require("./end-of-round");
const { PlaceTradegoodUnpicked } = require("./place-tradegood-unpicked");
const {
    Vector,
    Rotator,
    UIElement,
    Button,
    Border,
    HorizontalBox,
    world,
} = require("../../wrapper/api");

PHASE_UI_POS = { x: 0, y: -100, z: world.getTableHeight() + 5 };
PHASE_UI_ROT = { pitch: 0, roll: -90, yaw: 0 };

class PhaseUI {
    constructor() {}

    create() {
        const panel = new HorizontalBox().setChildDistance(5);

        panel.addChild(
            this._createButton("ui.phase.end_strategy_phase", () =>
                PlaceTradegoodUnpicked.placeAll()
            )
        );

        panel.addChild(
            this._createButton("ui.phase.deal_action_cards", () =>
                DealActionCards.dealToAll()
            )
        );

        panel.addChild(
            this._createButton("ui.phase.end_status_phase", () => {
                EndStatusPhase.returnCommandTokens();
                EndStatusPhase.repairShips();
                EndStatusPhase.refreshCards();
                EndStatusPhase.distributeCommandTokens();
                EndStatusPhase.returnStrategyCards();
            })
        );

        const ui = new UIElement();

        ui.position = new Vector(
            PHASE_UI_POS.x,
            PHASE_UI_POS.y,
            PHASE_UI_POS.z
        );

        ui.rotation = new Rotator(
            PHASE_UI_ROT.pitch,
            PHASE_UI_ROT.roll,
            PHASE_UI_ROT.yaw
        );

        ui.widget = new Border().setChild(panel);
        return ui;
    }

    _createButton(localeLabel, onClicked) {
        assert(typeof localeLabel === "string");
        assert(typeof onClicked === "function");

        const labelText = locale(localeLabel);
        const button = new Button().setText(labelText);

        button.onClicked.add(onClicked);
        return button;
    }
}

module.exports = { PhaseUI };
