const assert = require("../../wrapper/assert-wrapper");
const { Border, GameObject, Rotator, UIElement } = require("../../wrapper/api");
const { PlayerDesk } = require("../../lib/player-desk");

/**
 * A border holding the UI elements for the strategy card popups.
 * Since the UIElement added to the world does not have a association (i.e. child/parent)
 * to the containing widget, the UIElement itself contains all necessary associations:
 * - the UI added to the world and containing it
 * - the Desk on which it is displayed
 * - the strategy card which spawned the UI
 */
class StrategyCardBorder extends Border {
    /**
     * Constructor of a new StrategyCardBorder.
     * To handle the item correct on triggered events, the associations
     * <code>ui</code>, <code>card</code> and <code>playerDesk</code>
     * are necessary.
     *
     * @param data {object}
     * @param data.card {GameObject} the strategy card containing the border
     * @param data.desk {PlayerDesk} the player desk where the border will be placed
     * @param data.ui {UIElement} the UIElement containing the border
     */
    constructor(data) {
        assert(data.card instanceof GameObject);
        assert(data.desk instanceof PlayerDesk);
        assert(data.ui instanceof UIElement);

        super(data);

        this._card = data.card;
        this._desk = data.desk;
        this._ui = data.ui;
    }

    /**
     * @returns {GameObject} The strategy card associated with the border
     */
    get card() {
        return this._card;
    }

    /**
     * @returns {PlayerDesk} The playerDesk card associated with the border
     */
    get desk() {
        return this._desk;
    }

    /**
     * @returns {UIElement} The playerDesk card associated with the border
     */
    get ui() {
        return this._ui;
    }

    /**
     * Spawns the UI by setting the required associations, calculating the
     * position & rotation and adding the UI to the world.
     */
    spawnUi() {
        this._ui.useWidgetSize = false;
        this._ui.widget = this;
        this._ui.width = 350;
        this._ui.scale = 0.75;
        this._ui.position = this._desk.localPositionToWorld({
            x: 30,
            y: -10,
            z: 10,
        });
        this._ui.rotation = this._desk.localRotationToWorld(
            new Rotator(30, 0, 0)
        );
        world.addUI(this._ui);
    }
}

module.exports = {
    StrategyCardBorder,
};
