const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const CONFIG = require("../game-ui-config");
const {
    Border,
    Button,
    CheckBox,
    LayoutBox,
    Rotator,
    UIElement,
    Vector,
    VerticalBox,
    world,
} = require("../../wrapper/api");

/**
 * Per-desk "any whens / afters?" UI.  Note that zones do not hide world UI.
 * TTPG may offer screen space and/or more visibility control in the future.
 */
class AgendaUiDeskWhenAfter extends Border {
    constructor(playerDesk) {
        assert(playerDesk);
        super();

        this._playerDesk = playerDesk;

        this._anyWhens = new CheckBox()
            .setText(locale("ui.agenda.clippy.any_whens"))
            .setFontSize(CONFIG.fontSize)
            .setIsChecked(true);
        this._anyAfters = new CheckBox()
            .setText(locale("ui.agenda.clippy.any_afters"))
            .setFontSize(CONFIG.fontSize)
            .setIsChecked(true);
        this._playCard = new Button()
            .setText(locale("ui.agenda.clippy.play_card"))
            .setFontSize(CONFIG.fontSize);

        const panel = new VerticalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(this._anyWhens)
            .addChild(this._anyAfters)
            .addChild(this._playCard);
        const panelBox = new LayoutBox()
            .setPadding(
                CONFIG.padding,
                CONFIG.padding,
                CONFIG.padding,
                CONFIG.padding
            )
            .setChild(panel);
        this.setChild(panelBox);

        const localPos = new Vector(30, 0, 20);
        const localRot = new Rotator(25, 0, 0);
        this._ui = new UIElement();
        this._ui.position = playerDesk.localPositionToWorld(localPos);
        this._ui.rotation = playerDesk.localRotationToWorld(localRot);
        this._ui.widget = this;
    }

    get anyWhens() {
        return this._anyWhens;
    }

    get anyAfters() {
        return this._anyWhens;
    }

    get playCard() {
        return this._playCard;
    }

    attach() {
        world.addUI(this._ui);
        return this;
    }

    detach() {
        world.removeUIElement(this._ui);
        return this;
    }
}

module.exports = { AgendaUiDeskWhenAfter };
