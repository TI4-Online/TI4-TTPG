const assert = require("../../../wrapper/assert-wrapper");
const { MiltyDraft } = require("../milty/milty-draft");
const { MiltyUtil } = require("../milty/milty-util");
const { SCPTDraftSettings } = require("./scpt-draft-settings-ui");
const { world } = require("../../../wrapper/api");
const { Broadcast } = require("../../broadcast");

const FACTION_NAME_TO_NSID_NAME = {
    Arborec: "arborec",
    Argent: "argent",
    Creuss: "creuss",
    Empyrean: "empyrean",
    Hacan: "hacan",
    "Jol-Nar": "jolnar",
    L1Z1X: "l1z1x",
    Letnev: "letnev",
    Mahact: "mahact",
    Mentak: "mentak",
    Muaat: "muaat",
    "N'orr": "norr",
    Naalu: "naalu",
    "Naaz-Rokha": "naazrokha",
    Nekro: "nekro",
    Nomad: "nomad",
    Saar: "saar",
    Sol: "sol",
    Ul: "ul",
    "Vuil'raith": "vuilraith",
    Winnu: "winnu",
    Xxcha: "xxcha",
    Yin: "yin",
    Yssaril: "yssaril",

    Sardakk: "norr",
    Titans: "ul",
};

class SCPTDraft {
    constructor() {
        this._miltyDraft = false;

        const onClickHandlers = {
            start: (scptDraftData) => {
                this._start(scptDraftData);
            },
            cancel: () => {
                this._cancel();
            },
        };
        this._ui = new SCPTDraftSettings(onClickHandlers);
    }

    getUI() {
        return this._ui;
    }

    _start(scptDraftData) {
        console.log(`SCPTDraft._start: ${scptDraftData.name}`);
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
        const factionSetIndex = Math.floor(
            Math.random() * scptDraftData.factionSets.length
        );
        Broadcast.chatAll(`Faction set ${factionSetIndex}`);
        const factionSet = scptDraftData.factionSets[factionSetIndex];
        assert(factionSet);
        factionSet
            .split("|")
            .map((name) => {
                return FACTION_NAME_TO_NSID_NAME[name];
            })
            .forEach((name) => {
                this._miltyDraft.addFaction(name);
            });

        // Seats.
        const playerCount = world.TI4.config.playerCount;
        const speakerIndex = Math.floor(Math.random() * playerCount);
        this._miltyDraft.setSpeakerIndex(speakerIndex);

        this._miltyDraft.createPlayerUIs();
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

module.exports = { SCPTDraft };
