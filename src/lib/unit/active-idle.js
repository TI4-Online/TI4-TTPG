const assert = require("../../wrapper/assert-wrapper");
const locale = require("../locale");
const { ObjectSavedData } = require("../saved-data/object-saved-data");
const { Button, GameObject, UIElement } = require("../../wrapper/api");

const IS_ACTIVE_KEY = "isActive";

/**
 * Add active/idle buttons on relevant unit modifiers.
 */
class ActiveIdle {
    constructor() {
        throw new Error("static only");
    }

    /**
     * Add a toggle-active button to the object.
     *
     * @param {GameObject} obj
     */
    static addToggleActiveButton(obj) {
        assert(obj instanceof GameObject);

        const button = new Button();

        // Apply current state.
        const updateButton = (button) => {
            const localeText = ActiveIdle.isActive(obj)
                ? "ui.button.active"
                : "ui.button.idle";
            button.setText(locale(localeText));
        };
        updateButton(button);

        // Click to toggle and update state.
        button.onClicked((button, player) => {
            const toggled = !ActiveIdle.isActive(obj);
            ActiveIdle.setActive(obj, toggled);
            updateButton(button);
        });

        const ui = new UIElement();
        ui.widget = button;
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
