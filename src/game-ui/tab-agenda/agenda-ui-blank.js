const locale = require("../../lib/locale");
const CONFIG = require("../game-ui-config");
const {
    HorizontalAlignment,
    LayoutBox,
    Text,
    TextJustification,
    VerticalAlignment,
} = require("../../wrapper/api");

class AgendaUiBlank extends LayoutBox {
    constructor() {
        super();

        const text = new Text()
            .setText(locale("ui.agenda.clippy.place_agenda_to_start"))
            .setJustification(TextJustification.Center)
            .setFontSize(CONFIG.fontSize)
            .setAutoWrap(true);

        this.setHorizontalAlignment(HorizontalAlignment.Center)
            .setVerticalAlignment(VerticalAlignment.Center)
            .setChild(text);
    }
}

module.exports = { AgendaUiBlank };
