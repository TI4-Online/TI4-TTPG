const assert = require("../../../../wrapper/assert-wrapper");
const { SCPT2024UI } = require("./scpt-2024-ui");
const { world } = require("../../../../wrapper/api");
const {
    MiltySliceDraft,
} = require("../../../../lib/draft/milty2/milty-slice-draft");

class SCPT2024 {
    constructor() {
        this._miltySliceDraft = undefined;

        const onClickHandlers = {
            start: (scptDraftData) => {
                this._start(scptDraftData);
            },
            cancel: () => {
                this._cancel();
            },
        };
        this._ui = new SCPT2024UI(onClickHandlers);
    }

    getUI() {
        return this._ui.getWidget();
    }

    _start(scptDraftData) {
        assert(typeof scptDraftData === "object");

        console.log(`SCPT2024._start: ${scptDraftData.name}`);
        console.log(`#slices=${scptDraftData.slices.split("|").length}`);
        console.log(`#labels=${scptDraftData.labels.split("|").length}`);
        console.log(`#factions=${scptDraftData.factionCount}`);

        // Assemble custom input.
        let customInput = [
            `slices=${scptDraftData.slices}`,
            `labels=${scptDraftData.labels}`,
        ].join("&");
        if (scptDraftData.sounds) {
            customInput += `&sounds=${scptDraftData.sounds}`;
        }
        console.log(`SCPT2024._start: draft config "${customInput}"`);

        if (this._miltySliceDraft) {
            console.log("SCPT2024._start: in progress, aborting");
            return;
        }

        this._miltySliceDraft = new MiltySliceDraft();
        this._miltySliceDraft.setCustomInput(customInput);
        this._miltySliceDraft
            .getFactionGenerator()
            .setCount(scptDraftData.factionCount);
        this._miltySliceDraft.start();

        this._miltySliceDraft.onDraftStateChanged.add(() => {
            if (
                this._miltySliceDraft &&
                !this._miltySliceDraft.isDraftInProgress()
            ) {
                console.log("SCPT2024._start: draft cancelled, clearing state");
                this._miltySliceDraft = undefined;
            }
        });

        if (scptDraftData.clock) {
            this._startCountdown(scptDraftData.clock);
        }
    }

    _cancel() {
        console.log("SCPT2024._cancel");

        if (this._miltySliceDraft) {
            this._miltySliceDraft.cancel();
            this._miltySliceDraft = undefined;
        }
    }

    _startCountdown(seconds) {
        assert(typeof seconds === "number");
        assert(seconds > 0);

        console.log("SCPT2024._startCountdown");

        const timer = world.TI4.getTimer();
        if (timer) {
            assert(timer.__timer);
            timer.__timer.startCountdown(seconds);
        }
    }
}

module.exports = { SCPT2024 };
