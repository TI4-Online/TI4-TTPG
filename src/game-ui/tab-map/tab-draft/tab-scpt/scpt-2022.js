const assert = require("../../../../wrapper/assert-wrapper");
const { Broadcast } = require("../../../../lib/broadcast");
const { SCPT2022UI } = require("./scpt-2022-ui");
const {
    MiltySliceDraft,
} = require("../../../../lib/draft/milty2/milty-slice-draft");

class SCPT2022 {
    constructor() {
        this._miltySliceDraft = undefined;

        const onClickHandlers = {
            start: (scptDraftData, index) => {
                this._start(scptDraftData, index);
            },
            cancel: () => {
                this._cancel();
            },
        };
        this._ui = new SCPT2022UI(onClickHandlers);
    }

    getUI() {
        return this._ui;
    }

    _start(scptDraftData, factionSetIndex = -1) {
        console.log(
            `SCPT2022._start: ${scptDraftData.name}, ${factionSetIndex}`
        );

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

        // Assemble custom input.
        const customInput = [
            `slices=${scptDraftData.slices}`,
            `labels=${scptDraftData.labels}`,
            `factions=${factionSet}`,
        ].join("&");
        console.log(`SCPT2022._start: draft config "${customInput}"`);

        if (this._miltySliceDraft) {
            console.log("SCPT2022._start: in progress, aborting");
            return;
        }

        const player = undefined;
        this._miltySliceDraft = new MiltySliceDraft()
            .setCustomInput(customInput)
            .start(player);

        this._miltySliceDraft.onDraftStateChanged.add(() => {
            if (
                this._miltySliceDraft &&
                !this._miltySliceDraft.isDraftInProgress()
            ) {
                console.log("SCPT2023._start: draft cancelled, clearing state");
                this._miltySliceDraft = undefined;
            }
        });
    }

    _cancel() {
        console.log("SCPT2022._cancel");
        if (this._miltySliceDraft) {
            this._miltySliceDraft.cancel();
            this._miltySliceDraft = undefined;
        }
    }
}

module.exports = { SCPT2022 };
