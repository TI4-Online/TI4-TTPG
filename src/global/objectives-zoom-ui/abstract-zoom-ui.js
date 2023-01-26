const { UIElement, UIZoomVisibility } = require("../../wrapper/api");

/**
 * Zoom an objective card to see how far along each player is to scoring it.
 */
class AbstractZoomUI {
    constructor(card) {
        const ui = new UIElement();
        ui.zoomVisibility = UIZoomVisibility.ZoomedOnly;
        ui.anchorX = 1.1;
    }

    _getScoredByPlayerSlots() {
        // TODO XXX
    }
}

module.exports = { AbstractZoomUI };
