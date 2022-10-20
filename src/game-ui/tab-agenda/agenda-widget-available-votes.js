const assert = require("../../wrapper/assert-wrapper");
const CONFIG = require("../game-ui-config");
const { Agenda } = require("../../lib/agenda/agenda");
const {
    HorizontalAlignment,
    HorizontalBox,
    LayoutBox,
    Text,
    world,
} = require("../../wrapper/api");

class AgendaWidgetAvailableVotes extends LayoutBox {
    constructor(fontSize, deskIndex) {
        assert(typeof fontSize === "number");
        assert(typeof deskIndex === "number");

        super();

        this._availableVotesText = [];

        const panel = new HorizontalBox().setChildDistance(CONFIG.spacing);
        this.setHorizontalAlignment(HorizontalAlignment.Center).setChild(panel);

        world.TI4.getAllPlayerDesks().forEach((desk, index) => {
            if (index > 0) {
                const delim = new Text().setFontSize(fontSize).setText("|");
                panel.addChild(delim);
            }
            const text = new Text()
                .setFontSize(fontSize)
                .setTextColor(desk.plasticColor);
            panel.addChild(text);
            this._availableVotesText.push(text);
        });
        this.reset();
    }

    reset() {
        const deskIndexToAvailableVotes = Agenda.getDeskIndexToAvailableVotes();
        this._availableVotesText.forEach((text, index) => {
            const available = deskIndexToAvailableVotes[index] || 0;
            text.setText(available);
        });
    }
}

module.exports = { AgendaWidgetAvailableVotes };
