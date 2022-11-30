const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const CONFIG = require("../game-ui-config");
const { Agenda } = require("../../lib/agenda/agenda");
const {
    HorizontalAlignment,
    globalEvents,
    world,
} = require("../../wrapper/api");
const { WidgetFactory } = require("../../lib/ui/widget-factory");

let _deskIndexToWidgets = {};
globalEvents.TI4.onAgendaChanged.add((agendaCard) => {
    _deskIndexToWidgets = {}; // release for garbage collection
});

class AgendaWidgetAvailableVotes {
    static resetAll() {
        for (const widget of Object.values(_deskIndexToWidgets)) {
            assert(widget instanceof AgendaWidgetAvailableVotes);
            widget.reset();
        }
    }

    constructor(fontSize, deskIndex) {
        assert(typeof fontSize === "number");
        assert(typeof deskIndex === "number");

        const votesPanel = WidgetFactory.horizontalBox().setChildDistance(
            CONFIG.spacing
        );
        this._verticalBox = WidgetFactory.verticalBox()
            .setChildDistance(CONFIG.spacing)
            .setHorizontalAlignment(HorizontalAlignment.Center)
            .addChild(votesPanel);

        this._fontSize = fontSize;
        this._availableVotesText = [];

        world.TI4.getAllPlayerDesks().forEach((desk, index) => {
            if (index > 0) {
                const delim = WidgetFactory.text()
                    .setFontSize(fontSize)
                    .setText("|");
                votesPanel.addChild(delim);
            }
            const text = WidgetFactory.text()
                .setFontSize(fontSize)
                .setTextColor(desk.plasticColor);
            votesPanel.addChild(text);
            this._availableVotesText.push(text);
        });
        this.reset();

        // Keep a reference for easy mass-reset.
        _deskIndexToWidgets[deskIndex] = this;

        this._verticalBox._onFreed.add(() => {
            delete _deskIndexToWidgets[deskIndex];
        });
    }

    getWidget() {
        return this._verticalBox;
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
        const button = WidgetFactory.button()
            .setFontSize(this._fontSize)
            .setText(locale("ui.agenda.clippy.reset_available_votes"));
        button.onClicked.add((clickedButton, player) => {
            AgendaWidgetAvailableVotes.resetAll();
        });

        this._verticalBox.addChild(button);

        return this;
    }
}

module.exports = { AgendaWidgetAvailableVotes };
