const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const CONFIG = require("../game-ui-config");
const {
    HorizontalBox,
    ImageWidget,
    LayoutBox,
    Text,
    TextJustification,
    VerticalAlignment,
    VerticalBox,
    globalEvents,
    refPackageId,
    world,
} = require("../../wrapper/api");

// These objects come and go.  Register a single listener and propagate evetns.
let _agendaUiWhenMain = false;
const onTurnChangedProxy = (currentDesk, previousDesk, player) => {
    if (_agendaUiWhenMain) {
        _agendaUiWhenMain.update();
    }
};
globalEvents.TI4.onTurnChanged.add(onTurnChangedProxy);

class AgendaUiMainVote extends LayoutBox {
    constructor(doRefresh) {
        assert(typeof doRefresh === "function");

        super();

        this._doRefresh = doRefresh;

        const text = new Text()
            .setText(locale("ui.agenda.clippy.voting"))
            .setJustification(TextJustification.Center)
            .setFontSize(CONFIG.fontSize)
            .setAutoWrap(true);
        this._waitingFor = new Text()
            .setText(locale("ui.agenda.clippy.waiting_for_player_name"))
            .setJustification(TextJustification.Center)
            .setFontSize(CONFIG.fontSize)
            .setAutoWrap(true);
        const leftPanel = new VerticalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(text)
            .addChild(new Text().setText(" ").setFontSize(CONFIG.fontSize)) // spacer
            .addChild(this._waitingFor);

        const mechy = new ImageWidget()
            .setImage("global/ui/mechy.png", refPackageId)
            .setImageSize(256, 256);

        const panel = new HorizontalBox()
            .setChildDistance(CONFIG.spacing)
            .addChild(leftPanel, 1)
            .addChild(mechy, 0);

        this.setChild(panel).setVerticalAlignment(VerticalAlignment.Center);

        _agendaUiWhenMain = this;
        this.update();
    }

    update() {
        const playerName = world.TI4.turns.getCurrentTurn().colorName;
        this._waitingFor.setText(
            locale("ui.agenda.clippy.waiting_for_player_name", { playerName })
        );
        this._doRefresh();
    }
}

module.exports = { AgendaUiMainVote };
