const assert = require("../wrapper/assert");
const { System } = require("../lib/system/system");
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
} = require("../wrapper/api");

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
        this._obj.removeUI(this._uiElement);
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

        const panel = new VerticalBox().setChildDistance(5);
        let button;
        let subPanel;

        button = new Button().setText("Space Cannon Offense");
        button.onClicked.add((button, player) => {
            this._onButton("spaceCannon", false, player);
        });
        panel.addChild(button);

        panel.addChild(new Button().setText("Anti-Fighter Barrage"));
        panel.addChild(
            new Text()
                .setText("Announce Retreats")
                .setJustification(TextJustification.Center)
        );
        panel.addChild(new Button().setText("Space Combat"));
        panel.addChild(
            new Text()
                .setText("Retreat")
                .setJustification(TextJustification.Center)
        );

        panel.addChild(
            new Text()
                .setText("Bombardment")
                .setJustification(TextJustification.Center)
        );
        subPanel = new HorizontalBox().setChildDistance(5);
        system.planets.forEach((planet) => {
            subPanel.addChild(new Button().setText(planet.getNameStr()));
        });
        panel.addChild(subPanel);

        panel.addChild(
            new Text()
                .setText("Space Cannon Defense")
                .setJustification(TextJustification.Center)
        );
        subPanel = new HorizontalBox().setChildDistance(5);
        system.planets.forEach((planet) => {
            subPanel.addChild(new Button().setText(planet.getNameStr()));
        });
        panel.addChild(subPanel);

        panel.addChild(
            new Text()
                .setText("Ground Combat")
                .setJustification(TextJustification.Center)
        );
        subPanel = new HorizontalBox().setChildDistance(5);
        system.planets.forEach((planet) => {
            subPanel.addChild(new Button().setText(planet.getNameStr()));
        });
        panel.addChild(subPanel);

        // GameObject.updateUI does NOT update if you change the widget.
        this._uiElement.widget = new Border().setChild(panel);
        this._obj.removeUI(this._uiElement);
        this._obj.addUI(this._uiElement);
    }
}

module.exports = { AutoRollerUI };
