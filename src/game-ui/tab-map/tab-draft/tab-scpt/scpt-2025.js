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
const { Vector, ObjectType, Rotator } = require("@tabletop-playground/api");
const { MapStringLoad } = require("../../../../lib/map-string/map-string-load");
const { Spawn } = require("../../../../setup/spawn/spawn");

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

        if (scptDraftData.outerSystems) {
            // Move things so outer systems fit.
            const objIdToNewPos = {
                ["84p"]: new Vector(17.685, 10.237, 7.874),
                sf3: new Vector(5.517, 33.979, 7.874),
                ytv: new Vector(1.72, 35.769, 7.874),
                tuh: new Vector(1.72, 32.147, 7.874),
                x8q: new Vector(-1.902, 35.769, 7.874),
                vwx: new Vector(-1.902, 32.147, 7.874),
            };
            for (let [objId, newPos] of Object.entries(objIdToNewPos)) {
                const obj = world.getObjectById(objId);
                if (obj && obj.setType) {
                    newPos = newPos.multiply(2.5399); // recored positions in wrong units
                    obj.setType(ObjectType.Regular);
                    obj.setPosition(newPos);
                    obj.setType(ObjectType.Ground);
                }
            }

            // Spawn outer systems.
            const mapString =
                "{-1} -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 0 -1 -1 0 -1 -1 0 -1 -1 0 -1 -1 0 -1 -1 0 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 65 48 47 66 46 49 69";
            MapStringLoad.load(mapString);

            // Spawn wormhole tokens (only gamma on the map for now, must visit to get others).
            const nsidAndPositions = [
                {
                    nsid: "token.wormhole.exploration:pok/gamma",
                    pos: new Vector(20.375, 13.738, 8.073),
                },
                {
                    nsid: "token.wormhole.exploration:pok/gamma",
                    pos: new Vector(2.991, 23.931, 8.073),
                },
                {
                    nsid: "token.wormhole.creuss:base/alpha",
                    pos: new Vector(16.24, 13.354, 7.924),
                },
                {
                    nsid: "token.wormhole.creuss:base/alpha",
                    pos: new Vector(5.706, 21.77, 7.924),
                },
                {
                    nsid: "token.wormhole.creuss:base/beta",
                    pos: new Vector(16.088, 15.474, 7.924),
                },
                {
                    nsid: "token.wormhole.creuss:base/beta",
                    pos: new Vector(3.957, 20.639, 7.924),
                },
            ];
            const rot = new Rotator(0, 0, 180);
            for (let { nsid, pos } of nsidAndPositions) {
                pos = pos.multiply(2.5399); // recored positions in wrong units
                Spawn.spawn(nsid, pos, rot);
            }
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
