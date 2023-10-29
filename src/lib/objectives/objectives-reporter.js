const assert = require("../../wrapper/assert-wrapper");
const {
    AsyncTaskQueue,
    DEFAULT_ASYNC_DELAY,
} = require("../async-task-queue/async-task-queue");
const { ObjectivesUtil } = require("./objectives-util");
const {
    NSID_OBJECTIVE_PROGRESS,
    OBJECTIVE_NAME_ABBREVIATIONS,
} = require("./objectives.data");
const { globalEvents, world } = require("../../wrapper/api");

const INTERVAL_MSECS = 10 * 1000;

class ObjectivesReporter {
    constructor() {
        this._asyncTaskQueue = undefined;
        this._intervalHandle = undefined;
        this._nsidToProgress = {};
        this._nsidToScoredBy = {};
        this._processMissingObjectives = false;
    }

    _doAsync(task) {
        assert(typeof task === "function");
        if (!this._asyncTaskQueue) {
            this._asyncTaskQueue = new AsyncTaskQueue(
                DEFAULT_ASYNC_DELAY,
                world.TI4.onErr
            );
        }
        this._asyncTaskQueue.add(task);
    }

    setProcessMissingObjectives(value) {
        assert(typeof value === "boolean");
        this._processMissingObjectives = value;
        return this;
    }

    start() {
        assert(!this._intervalHandle);

        // Suppress if mock.
        if (world.__isMock) {
            return;
        }

        const asyncProcessObjectives = () => {
            this._doAsync(() => {
                this._processObjectives();
            });
        };
        this._intervalHandle = setInterval(
            asyncProcessObjectives,
            INTERVAL_MSECS
        );
        return this;
    }

    stop() {
        if (this._intervalHandle) {
            clearInterval(this._intervalHandle);
            this._intervalHandle = undefined;
        }
        return this;
    }

    /**
     * Get progress if known.
     *
     * @param {string} nsid
     * @returns {Object.{progress:{Object},scoredBy:{Array.{number}}}
     */
    getProgressAndScoredBy(nsid) {
        assert(typeof nsid === "string");
        const progress = this._nsidToProgress[nsid];
        const scoredBy = this._nsidToScoredBy[nsid];
        return { progress, scoredBy };
    }

    /**
     * Get summary in a JSON-friendly object.
     *
     * @param {boolean} getAll
     * @returns {Array.{abbr:string,nsid:string,stage:number,progress:Object.{header:string,values:Array.{value:string|number,success:boolean}},scoredBy:Array.{number}}}
     */
    getJsonReadySummary(getAll = false) {
        assert(typeof getAll === "boolean");
        let nsids = undefined;
        if (getAll) {
            nsids = ObjectivesUtil._sortNsids(
                Object.keys(NSID_OBJECTIVE_PROGRESS)
            );
        } else {
            this._nsidToScoredBy = {}; // forget any prior result
            const includeFaceDown = false; // do not leak face down cards!
            nsids = ObjectivesUtil.findPublicObjctivesAndAlreadyScored(
                includeFaceDown
            ).map((objectiveEntry) => {
                const { faceUp, nsid, scoredBy } = objectiveEntry;
                assert(typeof faceUp === "boolean");
                assert(typeof nsid === "string");
                assert(Array.isArray(scoredBy));
                if (faceUp) {
                    this._nsidToScoredBy[nsid] = scoredBy; // refresh to newest
                }
                return nsid;
            });
        }
        return nsids.map((nsid) => {
            assert(typeof nsid === "string");
            return {
                abbr: OBJECTIVE_NAME_ABBREVIATIONS[nsid] || "?",
                progress: this._nsidToProgress[nsid],
                scoredBy: this._nsidToScoredBy[nsid],
                stage: ObjectivesUtil._getObjectiveStage(nsid),
            };
        });
    }

    _processObjectives() {
        const includeFaceDown = true; // be ready when flips face up
        const objectiveEntries =
            ObjectivesUtil.findPublicObjctivesAndAlreadyScored(
                includeFaceDown
            ).filter((objectiveEntry) => {
                return NSID_OBJECTIVE_PROGRESS[objectiveEntry.nsid];
            });

        // Record latest (active only!) scoredBy, forget any prior result.
        this._nsidToScoredBy = {};
        for (const objectiveEntry of objectiveEntries) {
            const { faceUp, nsid, scoredBy } = objectiveEntry;
            assert(typeof faceUp === "boolean");
            assert(typeof nsid === "string");
            assert(Array.isArray(scoredBy));
            if (faceUp) {
                this._nsidToScoredBy[nsid] = scoredBy;
            }
        }

        // Schedule progress update.  Spread these out because they add up.
        for (const objectiveEntry of objectiveEntries) {
            const nsid = objectiveEntry.nsid;
            const getProgress = NSID_OBJECTIVE_PROGRESS[nsid];
            assert(typeof nsid === "string");
            assert(typeof getProgress === "function");
            this._doAsync(() => {
                this._nsidToProgress[nsid].progress = getProgress();
            });
        }

        // Optionally also update progress for missing objectives.
        if (this._processMissingObjectives) {
            for (const [nsid, getProgress] of Object.entries(
                NSID_OBJECTIVE_PROGRESS
            )) {
                assert(typeof nsid === "string");
                assert(typeof getProgress === "function");
                if (!this._nsidToScoredBy[nsid]) {
                    this._doAsync(() => {
                        this._nsidToProgress[nsid].progress = getProgress();
                    });
                }
            }
        }

        // Queue this *after* updating progress for others.
        this._doAsync(() => {
            globalEvents.TI4.onObjectiveProgressUpdated.trigger();
        });
    }
}

module.exports = { ObjectivesReporter };
