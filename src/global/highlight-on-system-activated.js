const assert = require("../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../lib/object-namespace");
const {
    Color,
    ImageWidget,
    Rotator,
    UIElement,
    Vector,
    globalEvents,
    refPackageId,
    world,
} = require("../wrapper/api");

const DISPLAY_SECONDS = 10;

let _img = undefined;
let _obj = undefined;
let _ui = undefined;
let _removeUiHandle = undefined;

function applyHighlight(obj, color) {
    // Keep the image around.
    if (!_img) {
        _img = new ImageWidget()
            .setImageSize(110, 0)
            .setImage("global/ui/hex_0_45_final.png", refPackageId);
    }
    color = new Color(color.r, color.g, color.b, 1);
    _img.setTintColor(color);

    // Release and re-create the ui element.
    if (_obj && _ui) {
        _obj.removeUIElement(_ui);
    }

    _obj = obj;
    _ui = new UIElement();
    _ui.position = new Vector(0, 0, 0.21);
    _ui.rotation = new Rotator(0, 0, 0);
    _ui.widget = _img;
    _obj.addUI(_ui);

    // Schedule removal.  Do not try fancy things like fading, world.updateUI flashes ALL UI.
    if (!world.__isMock) {
        if (_removeUiHandle) {
            clearTimeout(_removeUiHandle);
        }
        _removeUiHandle = setTimeout(() => {
            _obj.removeUIElement(_ui);
            _removeUiHandle = undefined;
        }, DISPLAY_SECONDS * 1000);
    }
}

globalEvents.TI4.onSystemActivated.add((obj, player) => {
    assert(ObjectNamespace.isSystemTile(obj));
    const currentDesk = world.TI4.turns.getCurrentTurn();
    const color = currentDesk ? currentDesk.plasticColor : new Color(1, 1, 0);
    applyHighlight(obj, color);
});
