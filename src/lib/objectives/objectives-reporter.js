const assert = require("../../wrapper/assert-wrapper");
const { ObjectivesUtil } = require("./objectives-util");
const {
    NSID_OBJECTIVE_PROGRESS,
    OBJECTIVE_NAME_ABBREVIATIONS,
} = require("./objectives.data");
const { world } = require("../../wrapper/api");

const INTERVAL_MSECS = 10 * 1000;

class ObjectivesReporter {
    constructor() {
        this._intervalHandle = undefined;
        this._objectiveEntries = [];
        this._processAll = false;
    }

    setProcessAll(value) {
        assert(typeof value === "boolean");
        this._processAll = value;
        return this;
    }

    start() {
        assert(!this._intervalHandle);
        this._intervalHandle = setInterval(() => {
            this._processObjectives();
        }, INTERVAL_MSECS);
        return this;
    }

    stop() {
        if (this._intervalHandle) {
            clearInterval(this._intervalHandle);
            this._intervalHandle = undefined;
        }
        return this;
    }

    getJsonReadyOutput() {
        return this._objectiveEntries;
    }

    _processObjectives() {
        // Remember any exising progress before clobbering old list.
        const nsidToExistingProgress = {};
        for (const objectiveEntry of this._objectiveEntries) {
            const { nsid, progress } = objectiveEntry;
            assert(typeof nsid === "string");
            nsidToExistingProgress[nsid] = progress;
        }

        // Get objectives on table, restricted to those we can process.
        this._objectiveEntries =
            ObjectivesUtil.findPublicObjctivesAndAlreadyScored().filter(
                (objectiveEntry) => {
                    return NSID_OBJECTIVE_PROGRESS[objectiveEntry.nsid];
                }
            );

        // Remember any exising scoredBy.
        const nsidToExistingScoredBy = {};
        for (const objectiveEntry of this._objectiveEntries) {
            const { nsid, scoredBy } = objectiveEntry;
            assert(typeof nsid === "string");
            assert(Array.isArray(scoredBy));
            nsidToExistingScoredBy[nsid] = scoredBy;
        }

        // If processing all, clobber list will full version.
        if (this._processAll) {
            const nsids = ObjectivesUtil._sortNsids(
                Object.keys(NSID_OBJECTIVE_PROGRESS)
            );
            this._objectiveEntries = nsids.map((nsid) => {
                return { nsid };
            });
        }

        // Fill in some fields, including progress and scoredBy from prior iteration.
        for (const objectiveEntry of this._objectiveEntries) {
            const nsid = objectiveEntry.nsid;
            objectiveEntry.abbr = OBJECTIVE_NAME_ABBREVIATIONS[nsid] || "?";
            objectiveEntry.active = nsidToExistingScoredBy[nsid] ? true : false;
            objectiveEntry.progress = nsidToExistingProgress[nsid];
            objectiveEntry.scoredBy = nsidToExistingScoredBy[nsid];
        }

        // Apply existing progress while waiting, prepare updators.
        const updators = [];
        for (const objectiveEntry of this._objectiveEntries) {
            const nsid = objectiveEntry.nsid;
            const getProgress = NSID_OBJECTIVE_PROGRESS[nsid];
            assert(typeof nsid === "string");
            assert(typeof getProgress === "function");
            updators.push(() => {
                objectiveEntry._updating = true;
                objectiveEntry.progress = getProgress();
                delete objectiveEntry._updating; // same frame, if ever appears true getProgress errored out
            });
        }

        // Push into the async task queue.
        for (const updator of updators) {
            world.TI4.asyncTaskQueue.add(updator);
        }
    }
}

module.exports = { ObjectivesReporter };
