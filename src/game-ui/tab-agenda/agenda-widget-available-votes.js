const assert = require("../../wrapper/assert-wrapper");
const CONFIG = require("../game-ui-config");
const { Agenda } = require("../../lib/agenda/agenda");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { WidgetFactory } = require("../../lib/ui/widget-factory");
const {
    HorizontalAlignment,
    Panel,
    Text,
    globalEvents,
    world,
} = require("../../wrapper/api");

// Keep private text widgets for editing.  Double index for (1) which player desk
// has the widget, and (2) which player desk within the widget.
const _deskIndexToDeskIndexToVoteText = {};
let _resetAllPending = false;

globalEvents.TI4.onAgendaChanged.add((agendaCard) => {
    AgendaWidgetAvailableVotes.resetAll();
});
globalEvents.TI4.onAgendaPlayerStateChanged.add(() => {
    AgendaWidgetAvailableVotes.resetAll();
});

class AgendaWidgetAvailableVotes {
    static resetAll() {
        const deskIndexToAvailableVotes = Agenda.getDeskIndexToAvailableVotes();
        const speakerDeskIndex = this._getSpeakerDeskIndex();
        for (const deskIndexToVoteText of Object.values(
            _deskIndexToDeskIndexToVoteText
        )) {
            for (const [deskIndexAsString, voteText] of Object.entries(
                deskIndexToVoteText
            )) {
                const deskIndex = Number.parseInt(deskIndexAsString);
                const votes = deskIndexToAvailableVotes[deskIndex];
                const speaker = deskIndex === speakerDeskIndex ? "*" : "";
                voteText.setText(votes + speaker);
            }
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

    static _getVoteText(deskIndex1, deskIndex2) {
        assert(typeof deskIndex1 === "number");
        assert(typeof deskIndex2 === "number");
        let deskIndexToVoteText = _deskIndexToDeskIndexToVoteText[deskIndex1];
        if (!deskIndexToVoteText) {
            deskIndexToVoteText = {};
            _deskIndexToDeskIndexToVoteText[deskIndex1] = deskIndexToVoteText;
        }
        let voteText = deskIndexToVoteText[deskIndex2];
        if (!voteText) {
            voteText = new Text();
            deskIndexToVoteText[deskIndex2] = voteText;
        }
        const parent = voteText.getParent();
        if (parent) {
            if (parent instanceof Panel) {
                parent.removeAllChildren();
            } else {
                throw new Error("unhandled parent type");
            }
        }

        return voteText;
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

        world.TI4.getAllPlayerDesks().forEach((desk, index) => {
            if (index > 0) {
                const delim = WidgetFactory.text()
                    .setFontSize(fontSize)
                    .setText("|");
                votesPanel.addChild(delim);
            }
            const text = AgendaWidgetAvailableVotes._getVoteText(
                deskIndex,
                index
            )
                .setFontSize(fontSize)
                .setTextColor(desk.plasticColor)
                .setText("-");
            votesPanel.addChild(text);
        });

        if (!_resetAllPending) {
            _resetAllPending = true;
            process.nextTick(() => {
                _resetAllPending = false;
                AgendaWidgetAvailableVotes.resetAll();
            });
        }
    }

    getWidget() {
        return this._verticalBox;
    }
}

module.exports = { AgendaWidgetAvailableVotes };
