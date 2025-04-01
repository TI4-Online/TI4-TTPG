const assert = require("../../../../wrapper/assert-wrapper");
const { SCPT2025UI } = require("./scpt-2025-ui");
const {
    ScptDraftSliceHistory,
} = require("../../../../lib/draft/scpt/scpt-draft-slice-history");
const { world } = require("../../../../wrapper/api");
const {
    MiltySliceDraft,
} = require("../../../../lib/draft/milty2/milty-slice-draft");
const { Broadcast } = require("../../../../lib/broadcast");

class SCPT2025 {
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
        this._ui = new SCPT2025UI(onClickHandlers);
    }

    getUI() {
        return this._ui.getWidget();
    }

    _start(scptDraftData) {
        assert(typeof scptDraftData === "object");

        const name = scptDraftData.name;
        let slices = scptDraftData.slices.split("|");
        let labels = scptDraftData.labels.split("|");
        let factionCount = scptDraftData.factionCount;

        if (scptDraftData.grabFromHistory) {
            const history = new ScptDraftSliceHistory().getPrelims();
            Broadcast.broadcastAll(`Using prelims slices from ${history.name}`);
            slices = history.slices.split("|");
            labels = history.labels.split("|");
        }

        if (scptDraftData.resizeToPlayerCount) {
            const playerCount = world.TI4.config.playerCount;
            console.log(`SCPT2025._start: resizing to ${playerCount} players`);
            while (slices.length > playerCount) {
                const i = Math.floor(Math.random() * slices.length);
                slices.splice(i, 1);
                labels.splice(i, 1);
            }
            factionCount = Math.min(factionCount, playerCount);
        }

        console.log(`SCPT2025._start: ${name}`);
        console.log(`#slices=${slices.length}`);
        console.log(`#labels=${labels.length}`);
        console.log(`#factions=${factionCount}`);

        // Assemble custom input.
        let customInput = [
            `slices=${slices.join("|")}`,
            `labels=${labels.join("|")}`,
        ].join("&");
        if (scptDraftData.factions) {
            customInput += `&factions=${scptDraftData.factions.toLowerCase()}`;
        }
        console.log(`SCPT2025._start: draft config "${customInput}"`);

        if (this._miltySliceDraft) {
            console.log("SCPT2025._start: in progress, aborting");
            return;
        }

        this._miltySliceDraft = new MiltySliceDraft();
        this._miltySliceDraft.setCustomInput(customInput);
        this._miltySliceDraft.getFactionGenerator().setCount(factionCount);

        if (scptDraftData.seedWithOnTableCards) {
            this._miltySliceDraft
                .getFactionGenerator()
                .setSeedWithOnTableCards(true);
        }

        this._miltySliceDraft.start();

        this._miltySliceDraft.onDraftStateChanged.add(() => {
            if (
                this._miltySliceDraft &&
                !this._miltySliceDraft.isDraftInProgress()
            ) {
                console.log("SCPT2025._start: draft cancelled, clearing state");
                this._miltySliceDraft = undefined;
            }
        });

        if (scptDraftData.clock) {
            this._startCountdown(scptDraftData.clock);
        }
    }

    _cancel() {
        console.log("SCPT2025._cancel");

        if (this._miltySliceDraft) {
            this._miltySliceDraft.cancel();
            this._miltySliceDraft = undefined;
        }
    }

    _startCountdown(seconds) {
        assert(typeof seconds === "number");
        assert(seconds > 0);

        console.log("SCPT2025._startCountdown");

        const timer = world.TI4.getTimer();
        if (timer) {
            assert(timer.__timer);
            timer.__timer.startCountdown(seconds);
        }
    }
}

module.exports = { SCPT2025 };
