const assert = require("../wrapper/assert-wrapper");
const { ColorUtil } = require("../lib/color/color-util");
const { ObjectNamespace } = require("../lib/object-namespace");
const {
    Color,
    GameObject,
    ImageWidget,
    Rotator,
    UIElement,
    Vector,
    globalEvents,
    refPackageId,
    world,
} = require("../wrapper/api");

const OVERLAY_PNG = "global/ui/hex_highlight_notched.png";
const OVERLAY_PNG_SIZE = 115;
const OVERLAY_SCALE = 4;

const PULSE_SECONDS = 3; // from 0->1->0
const DISPLAY_SECONDS_APPROX = 15; // 30 in TTS
const DISPLAY_SECONDS =
    Math.ceil(DISPLAY_SECONDS_APPROX / PULSE_SECONDS) * PULSE_SECONDS; // complete last pulse

let _img = undefined;
let _systemHighlight = undefined;

class SystemHighlight {
    constructor(obj, color) {
        assert(obj instanceof GameObject);
        assert(ColorUtil.isColor(color));

        this._mintTimeMsecs = Date.now();
        this._obj = obj;
        this._color = new Color(color.r, color.g, color.b, 1);
        this._ui = new UIElement();
        this._updateHandler = () => {
            const age = Date.now() - this._mintTimeMsecs;
            if (age / 1000 > DISPLAY_SECONDS) {
                this.detachUI();
                return;
            }
            this.updateImg();
        };

        // Attach UI (registers listener).
        this.attachUI();
    }

    attachUI() {
        // Keep image around for future use.
        if (!_img) {
            _img = new ImageWidget()
                .setImageSize(OVERLAY_PNG_SIZE * OVERLAY_SCALE, 0)
                .setImage(OVERLAY_PNG, refPackageId);
        }

        this._ui.position = new Vector(0, 0, 0.13);
        this._ui.rotation = new Rotator(0, 0, 0);
        this._ui.widget = _img;
        this._ui.useTransparency = true;
        this._ui.scale = 1 / OVERLAY_SCALE;
        this._obj.addUI(this._ui);

        this.updateImg();
        globalEvents.onTick.add(this._updateHandler);
    }

    detachUI() {
        globalEvents.onTick.remove(this._updateHandler);
        this._obj.removeUIElement(this._ui);
    }

    updateImg() {
        const age = (Date.now() - this._mintTimeMsecs) / 1000;
        const u = (age % PULSE_SECONDS) / PULSE_SECONDS;
        const phi = u * Math.PI * 2;
        this._color.a = 1 - (Math.cos(phi) + 1) / 2;
        assert(this._color.a >= 0 && this._color.a <= 1);
        _img.setTintColor(this._color);
    }
}

function applyHighlight(obj, color) {
    // Remove any old UI.
    if (_systemHighlight) {
        _systemHighlight.detachUI();
        _systemHighlight = undefined;
    }

    _systemHighlight = new SystemHighlight(obj, color);
}

globalEvents.TI4.onSystemActivated.add((obj, player) => {
    assert(ObjectNamespace.isSystemTile(obj));
    const currentDesk = world.TI4.turns.getCurrentTurn();
    const color = currentDesk ? currentDesk.plasticColor : new Color(1, 1, 0);
    applyHighlight(obj, color);
});
