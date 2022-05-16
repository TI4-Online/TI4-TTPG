const assert = require("../../wrapper/assert-wrapper");
const locale = require("../locale");
const { ObjectSavedData } = require("../saved-data/object-saved-data");
const {
    Button,
    GameObject,
    Rotator,
    Vector,
    UIElement,
} = require("../../wrapper/api");

const IS_ACTIVE_KEY = "isActive";

/**
 * Add active/idle buttons on relevant unit modifiers.
 */
class ActiveIdle {
    constructor() {
        throw new Error("static only");
    }

    /**
     * Remove toggle-active button.
     *
     * @param {GameObject} obj
     */
    static removeToggleActiveButton(obj) {
        // Don't be clever (yet), just remove all UI.
        for (const ui of obj.getUIs()) {
            obj.removeUIElement(ui);
        }
    }

    /**
     * Add a toggle-active button to the object.
     *
     * @param {GameObject} obj
     */
    static addToggleActiveButton(obj) {
        assert(obj instanceof GameObject);

        ActiveIdle.removeToggleActiveButton(obj);

        const button = new Button().setFontSize(10).setText("<???>");

        // Apply current state.
        const updateButton = (button) => {
            const localeText = ActiveIdle.isActive(obj)
                ? "ui.button.active"
                : "ui.button.idle";
            button.setText(locale(localeText));
        };
        updateButton(button);

        // Click to toggle and update state.
        button.onClicked.add((button, player) => {
            const toggled = !ActiveIdle.isActive(obj);
            ActiveIdle.setActive(obj, toggled);
            updateButton(button);
        });

        const ui = new UIElement();
        ui.widget = button;

        const extent = obj.getExtent();
        ui.position = new Vector(-extent.x, 0, -extent.z - 0.1);
        ui.rotation = new Rotator(180, 180, 0);

        obj.addUI(ui);
    }

    /**
     * Is the toggle-active unit modifier currently active?
     *
     * @param {GameObject} obj
     * @returns {boolean} true if active
     */
    static isActive(obj) {
        assert(obj instanceof GameObject);
        return ObjectSavedData.get(obj, IS_ACTIVE_KEY, false);
    }

    /**
     * Set active/idle status.  Normally called by internally-added button,
     * if called manually button may be wrong!
     *
     * @param {GameObject} obj
     * @param {boolean} value
     */
    static setActive(obj, value) {
        assert(obj instanceof GameObject);
        assert(typeof value === "boolean");
        ObjectSavedData.set(obj, IS_ACTIVE_KEY, value);
    }
}

module.exports = { ActiveIdle };
