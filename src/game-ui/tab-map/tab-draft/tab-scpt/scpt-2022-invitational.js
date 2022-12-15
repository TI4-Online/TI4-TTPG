const { world } = require("../../../../wrapper/api");
const { MiltyDraft } = require("../../../../lib/draft/milty/milty-draft");
const { MiltyUtil } = require("../../../../lib/draft/milty/milty-util");
const { SCPT2022InvitationalUI } = require("./scpt-2022-invitational-ui");
const { TURN_ORDER_TYPE } = require("../../../../lib/turns");
const {
    MiltyFactionGenerator,
} = require("../../../../lib/draft/milty/milty-faction-generator");
const { Broadcast } = require("../../../../lib/broadcast");

class SCPT2022Invitational {
    constructor() {
        this._miltyDraft = false;

        const onClickHandlers = {
            randomizeTurnOrder: () => {
                this._randomizeTurnOrder(TURN_ORDER_TYPE.FORWARD);
            },
            start: (scptDraftData) => {
                this._start(scptDraftData);
            },
            cancel: () => {
                this._cancel();
            },
        };
        this._ui = new SCPT2022InvitationalUI(onClickHandlers);
    }

    getUI() {
        return this._ui;
    }

    _randomizeTurnOrder(turnOrderType) {
        const playerDesks = world.TI4.getAllPlayerDesks();
        const player = undefined;
        world.TI4.turns.randomizeTurnOrder(playerDesks, player, turnOrderType);
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
            const slice = slices[i];
            const label = labels[i];
            console.log(`${i}: ${slice} "${label}"`);
            this._miltyDraft.addSlice(slice, false, label);
        }

        // Seats.
        const playerCount = world.TI4.config.playerCount;
        const speakerIndex = Math.floor(Math.random() * playerCount);
        this._miltyDraft.setSpeakerIndex(speakerIndex);

        // Factions.
        const factionNsidNames =
            MiltyFactionGenerator.getOnTableFactionCardNsidNames();
        factionNsidNames.forEach((name) => {
            this._miltyDraft.addFaction(name);
        });
        if (factionNsidNames.length < world.TI4.config.playerCount) {
            Broadcast.broadcastAll("Not enough face-up factions!");
            this._miltyDraft = undefined;
            return;
        }

        this._randomizeTurnOrder(TURN_ORDER_TYPE.SNAKE);
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

module.exports = { SCPT2022Invitational };
