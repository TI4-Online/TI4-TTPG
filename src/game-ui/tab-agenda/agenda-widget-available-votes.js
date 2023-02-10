const assert = require("../../wrapper/assert-wrapper");
const CONFIG = require("../game-ui-config");
const { Agenda } = require("../../lib/agenda/agenda");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { WidgetFactory } = require("../../lib/ui/widget-factory");
const { TextJustification, globalEvents, world } = require("../../wrapper/api");

// Keep private text widgets for editing.  Double index for (1) which player desk
// has the widget, and (2) which player desk within the widget.
const _deskIndexToRichText = {};
let _resetAllPending = false;

globalEvents.TI4.onAgendaChanged.add((agendaCard) => {
    AgendaWidgetAvailableVotes.resetAll();
});
globalEvents.TI4.onAgendaPlayerStateChanged.add(() => {
    AgendaWidgetAvailableVotes.resetAll();
});

class AgendaWidgetAvailableVotes {
    static resetAll() {
        const playerDesks = world.TI4.getAllPlayerDesks();
        const deskIndexToAvailableVotes = Agenda.getDeskIndexToAvailableVotes();
        const speakerDeskIndex = this._getSpeakerDeskIndex();

        const entries = [];
        for (const [deskIndexAsString, votes] of Object.entries(
            deskIndexToAvailableVotes
        )) {
            const deskIndex = Number.parseInt(deskIndexAsString);
            const color = playerDesks[deskIndex].widgetColor
                .toHex()
                .substring(0, 6)
                .toLowerCase();
            const speaker = deskIndex === speakerDeskIndex ? "*" : "";
            entries.push(`[color=#${color}]${votes}${speaker}[/color]`);
        }
        const text = entries.join(" | ");
        for (const richText of Object.values(_deskIndexToRichText)) {
            richText.setText(text);
        }
    }

    static _getSpeakerDeskIndex() {
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid === "token:base/speaker") {
                const pos = obj.getPosition();
                const desk = world.TI4.getClosestPlayerDesk(pos);
                return desk.index;
            }
        }
        return -1; //missing token?
    }

    constructor(fontSize, deskIndex) {
        assert(typeof fontSize === "number");
        assert(typeof deskIndex === "number");

        this._richText = WidgetFactory.richText()
            .setFontSize(CONFIG.fontSize)
            .setJustification(TextJustification.Center)
            .setText("???");
        _deskIndexToRichText[deskIndex] = this._richText;

        if (!_resetAllPending) {
            _resetAllPending = true;
            process.nextTick(() => {
                _resetAllPending = false;
                AgendaWidgetAvailableVotes.resetAll();
            });
        }
    }

    getWidget() {
        return this._richText;
    }
}

module.exports = { AgendaWidgetAvailableVotes };
