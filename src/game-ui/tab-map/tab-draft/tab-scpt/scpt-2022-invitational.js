const { Broadcast } = require("../../../../lib/broadcast");
const { SCPT2022InvitationalUI } = require("./scpt-2022-invitational-ui");
const { TURN_ORDER_TYPE } = require("../../../../lib/turns");
const {
    AbstractFactionGenerator,
} = require("../../../../lib/draft/abstract/abstract-faction-generator");
const {
    MiltySliceDraft,
} = require("../../../../lib/draft/milty2/milty-slice-draft");
const { globalEvents, world } = require("../../../../wrapper/api");

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
        console.log(`SCPT2022Invitational._start: ${scptDraftData.name}`);

        // Factions.
        const factionCards = AbstractFactionGenerator._getOnTableFactionCards();
        const factionNsidNames =
            AbstractFactionGenerator._getOnTableFactionCardNsidNames();
        if (factionNsidNames.length < world.TI4.config.playerCount) {
            Broadcast.broadcastAll(
                "Not enough face-up factions!",
                Broadcast.ERROR
            );
            return false;
        }

        // Discard faction cards.
        const container = undefined;
        const player = undefined;
        globalEvents.TI4.onContainerRejected.trigger(
            container,
            factionCards,
            player
        );

        // Assemble custom input.
        const customInput = [
            `slices=${scptDraftData.slices}`,
            `labels=${scptDraftData.labels}`,
            `factions=${factionNsidNames.join("|")}`,
        ].join("&");
        console.log(
            `SCPT2022Invitational._start: draft config "${customInput}"`
        );

        if (this._miltySliceDraft) {
            console.log("SCPT2022Invitational._start: in progress, aborting");
            return;
        }

        this._miltySliceDraft = new MiltySliceDraft()
            .setCustomInput(customInput)
            .start(player);

        this._miltySliceDraft.onDraftStateChanged.add(() => {
            if (
                this._miltySliceDraft &&
                !this._miltySliceDraft.isDraftInProgress()
            ) {
                console.log(
                    "SCPT2022Invitational._start: draft cancelled, clearing state"
                );
                this._miltySliceDraft = undefined;
            }
        });

        return true;
    }

    _cancel() {
        console.log("SCPT2022Invitational._cancel");
        if (this._miltySliceDraft) {
            this._miltySliceDraft.cancel();
            this._miltySliceDraft = undefined;
        }
    }
}

module.exports = { SCPT2022Invitational };
