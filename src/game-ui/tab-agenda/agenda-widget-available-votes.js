const assert = require("../../wrapper/assert-wrapper");
const CONFIG = require("../game-ui-config");
const { Agenda } = require("../../lib/agenda/agenda");
const {
    HorizontalAlignment,
    HorizontalBox,
    LayoutBox,
    Text,
    globalEvents,
    world,
} = require("../../wrapper/api");
const { Button } = require("@tabletop-playground/api");
const locale = require("../../lib/locale");

let _deskIndexToWidgets = {};
globalEvents.TI4.onAgendaChanged.add((agendaCard) => {
    _deskIndexToWidgets = {}; // release for garbage collection
});

class AgendaWidgetAvailableVotes extends LayoutBox {
    static resetAll() {
        for (const widget of Object.values(_deskIndexToWidgets)) {
            assert(widget instanceof AgendaWidgetAvailableVotes);
            widget.reset();
        }
    }

    constructor(fontSize, deskIndex) {
        assert(typeof fontSize === "number");
        assert(typeof deskIndex === "number");

        super();

        this._fontSize = fontSize;
        this._availableVotesText = [];
        this._panel = new HorizontalBox().setChildDistance(CONFIG.spacing);
        this.setHorizontalAlignment(HorizontalAlignment.Center).setChild(
            this._panel
        );

        world.TI4.getAllPlayerDesks().forEach((desk, index) => {
            if (index > 0) {
                const delim = new Text().setFontSize(fontSize).setText("|");
                this._panel.addChild(delim);
            }
            const text = new Text()
                .setFontSize(fontSize)
                .setTextColor(desk.plasticColor);
            this._panel.addChild(text);
            this._availableVotesText.push(text);
        });
        this.reset();

        // Keep a reference for easy mass-reset.
        _deskIndexToWidgets[deskIndex] = this;
    }

    reset() {
        const deskIndexToAvailableVotes = Agenda.getDeskIndexToAvailableVotes();
        this._availableVotesText.forEach((text, index) => {
            const available = deskIndexToAvailableVotes[index] || 0;
            text.setText(available);
        });
        return this;
    }

    addResetButton() {
        const button = new Button()
            .setFontSize(this._fontSize)
            .setText(locale("ui.button.reset"));
        button.onClicked.add((button, player) => {
            AgendaWidgetAvailableVotes.resetAll();
        });
        this._panel.addChild(button);
        return this;
    }
}

module.exports = { AgendaWidgetAvailableVotes };
