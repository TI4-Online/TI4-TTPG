const assert = require("../../wrapper/assert-wrapper");
const {
    Card,
    UIElement,
    UIZoomVisibility,
    world,
} = require("../../wrapper/api");

/**
 * Zoom an objective card to see how far along each player is to scoring it.
 */
class AbstractZoomUI {
    constructor(card) {
        assert(card instanceof Card);

        this._card = card;

        this._ui = new UIElement();
        this._ui.zoomVisibility = UIZoomVisibility.ZoomedOnly;
        this._ui.anchorX = 1.1;
    }

    update() {
        if (!this._card.isValid() || this._card.getStackSize() > 1) {
            this._card.removeUIElement(this._ui);
            return; // do not schedule a future update
        }

        // Schedule future update.
    }

    _getScoredByPlayerSlots() {
        // TODO XXX
    }
}

module.exports = { AbstractZoomUI };
