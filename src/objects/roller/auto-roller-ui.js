const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { System } = require("../../lib/system/system");
const {
    Border,
    Button,
    GameObject,
    HorizontalBox,
    Text,
    TextJustification,
    UIElement,
    VerticalBox,
} = require("../../wrapper/api");

/**
 * Manage the UI on an AutoRoller object.
 */
class AutoRollerUI extends Border {
    /**
     * Constructor.
     *
     * @param {function} onButton - called with (rollType: string, planet: Planet or false, player: Player)
     */
    constructor(onButton) {
        assert(onButton);
        super();
        this._gameObject = false;
        this._uiElement = false;
        this._onButton = onButton;

        this.resetAwaitingSystemActivation();
    }

    setOwningObjectForUpdate(gameObject, uiElement) {
        assert(gameObject instanceof GameObject);
        assert(uiElement instanceof UIElement);
        this._gameObject = gameObject;
        this._uiElement = uiElement;
    }

    _update() {
        if (this._gameObject && this._uiElement) {
            this._gameObject.updateUI(this._uiElement);
        }
    }

    /**
     * Reset for "no system activated".
     */
    resetAwaitingSystemActivation() {
        const panels = [new VerticalBox().setChildDistance(5)];

        const addButton = (localeText, combatType, planet) => {
            const button = new Button().setText(locale(localeText));
            button.onClicked.add((button, player) => {
                this._onButton(combatType, planet, player);
            });
            panels[panels.length - 1].addChild(button);
        };

        const addText = (localeText) => {
            const text = new Text()
                .setText(locale(localeText))
                .setJustification(TextJustification.Left);
            panels[panels.length - 1].addChild(text);
        };

        addText("ui.message.no_system_activated");

        addButton("ui.roller.report_modifiers", "reportModifiers", false);

        this.setChild(panels[0]);
        this._update();
    }

    /**
     * Reset for the given system.
     *
     * Get localized planet names by: `system.planets[].getNameStr()`
     *
     * To test with a system get one via `world.TI4.getSystemByTileNumber(#)`.
     *
     * @param {System} system
     */
    resetAfterSystemActivation(system) {
        assert(system instanceof System);

        const panels = [new VerticalBox().setChildDistance(5)];

        const addButton = (localeText, combatType, planet) => {
            const button = new Button().setText(locale(localeText));
            button.onClicked.add((button, player) => {
                this._onButton(combatType, planet, player);
            });
            panels[panels.length - 1].addChild(button);
        };

        const addText = (localeText) => {
            const text = new Text()
                .setText(locale(localeText))
                .setJustification(TextJustification.Left);
            panels[panels.length - 1].addChild(text);
        };

        const addHorizontalSubPanel = () => {
            const panel = new HorizontalBox().setChildDistance(5);
            panels[panels.length - 1].addChild(panel);
            panels.push(panel);
        };

        addButton("ui.roller.space_cannon_offense", "spaceCannon", false);
        addButton(
            "ui.roller.anti_fighter_barrage",
            "antiFighterBarrage",
            false
        );

        //addText("ui.roller.announce_retreat");
        addButton("ui.roller.space_combat", "spaceCombat", false);
        //addText("ui.roller.retreat");

        addText("ui.roller.bombardment");
        addHorizontalSubPanel();
        system.planets.forEach((planet) => {
            addButton(planet.localeName, "bombardment", planet);
        });
        panels.pop();

        addText("ui.roller.space_cannon_defense");
        addHorizontalSubPanel();
        system.planets.forEach((planet) => {
            addButton(planet.localeName, "spaceCannon", planet);
        });
        panels.pop();

        addText("ui.roller.ground_combat");
        addHorizontalSubPanel();
        system.planets.forEach((planet) => {
            addButton(planet.localeName, "groundCombat", planet);
        });
        panels.pop();

        addButton("ui.roller.report_modifiers", "reportModifiers", false);

        this.setChild(panels[0]);
        this._update();
    }
}

module.exports = { AutoRollerUI };
