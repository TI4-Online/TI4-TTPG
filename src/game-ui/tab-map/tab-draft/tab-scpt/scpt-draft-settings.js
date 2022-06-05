const assert = require("../../../../wrapper/assert-wrapper");
const { Broadcast } = require("../../../../lib/broadcast");
const { FactionAliases } = require("../../../../lib/faction/faction-aliases");
const { MiltyDraft } = require("../../../../lib/draft/milty/milty-draft");
const { MiltyUtil } = require("../../../../lib/draft/milty/milty-util");
const { SCPTDraftSettingsUI } = require("./scpt-draft-settings-ui");
const { refPackageId, world } = require("../../../../wrapper/api");

class SCPTDraftSettings {
    constructor() {
        this._miltyDraft = false;

        const onClickHandlers = {
            start: (scptDraftData, index) => {
                this._start(scptDraftData, index);
            },
            cancel: () => {
                this._cancel();
            },
        };
        this._ui = new SCPTDraftSettingsUI(onClickHandlers);
    }

    getUI() {
        return this._ui;
    }

    _start(scptDraftData, factionSetIndex = -1) {
        console.log(
            `SCPTDraft._start: ${scptDraftData.name}, ${factionSetIndex}`
        );
        if (this._miltyDraft) {
            console.log("SCPTDraft._start: in progress, aborting");
            return;
        }
        this._miltyDraft = new MiltyDraft();

        // Slices.
        const slices = scptDraftData.slices.split("|").map((sliceStr) => {
            return MiltyUtil.parseSliceString(sliceStr);
        });
        const labels = scptDraftData.labels.split("|");
        for (let i = 0; i < slices.length; i++) {
            this._miltyDraft.addSlice(slices[i], false, labels[i]);
        }

        // Factions.
        if (factionSetIndex < 0) {
            factionSetIndex = Math.floor(
                Math.random() * scptDraftData.factionSets.length
            );
        }
        Broadcast.chatAll(
            `"${scptDraftData.name}", faction set ${factionSetIndex + 1}`
        );
        const factionSet = scptDraftData.factionSets[factionSetIndex];
        assert(factionSet);
        factionSet
            .split("|")
            .map((name) => {
                return FactionAliases.getNsid(name);
            })
            .forEach((name) => {
                this._miltyDraft.addFaction(name);
            });

        // Seats.
        const playerCount = world.TI4.config.playerCount;
        const speakerIndex = Math.floor(Math.random() * playerCount);
        this._miltyDraft.setSpeakerIndex(speakerIndex);

        this._miltyDraft.createPlayerUIs();

        // Sound effects for slice pick
        let sounds = scptDraftData.sounds;
        if (sounds) {
            sounds = sounds.split("|");
            for (let i = 0; i < sounds.length; i++) {
                const sound = world.importSound(sound, refPackageId);
                this._miltyDraft.setSound(i, sound);
            }
        }
    }

    _cancel() {
        console.log("SCPTDraft._cancel");
        if (!this._miltyDraft) {
            return;
        }
        this._miltyDraft.cancel();
        this._miltyDraft = false;
    }
}

module.exports = { SCPTDraftSettings };
