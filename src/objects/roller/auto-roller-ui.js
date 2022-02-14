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
    Vector,
    VerticalBox,
} = require("../../wrapper/api");

/**
 * Manage the UI on an AutoRoller object.
 */
class AutoRollerUI {
    /**
     * Constructor.
     *
     * @param {GameObject} gameObject
     * @param {function} onButton - called with (rollType: string, planet: Planet or false, player: Player)
     */
    constructor(gameObject, onButton) {
        assert(gameObject instanceof GameObject);
        this._obj = gameObject;
        this._onButton = onButton;

        this._uiElement = new UIElement();
        this._uiElement.position = new Vector(0, 0, 5);

        this._uiElement.widget = new Border();
        this._obj.addUI(this._uiElement);

        //this.resetAwaitingSystemActivation();

        const system = System.getByTileNumber(69);
        this.resetAfterSystemActivation(system);
    }

    /**
     * Reset for "no system activated".
     */
    resetAwaitingSystemActivation() {
        this._uiElement.widget = new Border().setChild(
            new Text().setText("no system activated")
        );

        // GameObject.updateUI does NOT update if you change the widget.
        this._obj.removeUIElement(this._uiElement);
        this._obj.addUI(this._uiElement);
    }

    /**
     * Reset for the given system.
     *
     * Get localized planet names by: `system.planets[].getNameStr()`
     *
     * To test with a system get one via `System.getByTileNumber(#)`.
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

        addButton("ui.roller.space_cannon_offsense", "spaceCannon", false);
        addButton(
            "ui.roller.anti_fighter_barrage",
            "antiFighterBarrage",
            false
        );
        addText("ui.roller.announce_retreats");
        addButton("ui.roller.space_combat", "spaceCombat", false);

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

        // GameObject.updateUI does NOT update if you change the widget.
        this._obj.removeUIElement(this._uiElement);
        this._uiElement.widget = new Border().setChild(panels[0]);
        this._obj.addUI(this._uiElement);
    }
}

module.exports = { AutoRollerUI };
