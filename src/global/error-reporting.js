const TriggerableMulticastDelegate = require("../lib/triggerable-multicast-delegate");
const { fetch, world } = require("../wrapper/api");
const assert = require("../wrapper/assert-wrapper");

const REPORT_URL = "https://ti4-game-data.appspot.com/reporterror";
//const REPORT_URL = "http://localhost:8080/reporterror";

// Send error reports to an external site
class ErrorReporting {
    constructor() {
        this._stackToEntry = {};
        this._extra = undefined;
    }

    setExtra(value) {
        assert(typeof value === "string");
        this._extra = value;
        return this;
    }

    clearExtra() {
        this._extra = undefined;
        return this;
    }

    error(err) {
        assert(typeof err === "string");

        // Prune out early path.
        const errArray = err
            .split("\n")
            .map((s) => s.replace(/file:\/\/.*\/Scripts\//, ""))
            .map((s) => s.replace(/:[0-9]*[)]?$/, ""))
            .map((s) => s.trim());
        err = errArray.join("\n");

        // Log the error?  Normal error handling does that in red.
        const delim = "----------";
        console.log(`ErrorReporting.error:\n${delim}\n${err}\n${delim}`);

        // Report to external store?
        if (!world.TI4.config.reportErrors) {
            // Careful, if inside a try/catch the error might be lost.  (e.g. log above)
            return;
        }

        const now = Date.now() / 1000;
        let entry = this._stackToEntry[err];
        if (!entry) {
            entry = {
                stackTrace: errArray,
                count: 0,
                reportCount: 0,
                players: world.getAllPlayers().map((x) => {
                    return x.getName() + (x.isHost() ? "*" : "");
                }),
                config: {
                    playerCount: world.TI4.config.playerCount,
                    setupTimestamp: world.TI4.config.timestamp,
                },
                timestamp: now,
            };
            if (this._extra) {
                entry.extra = this._extra;
            }
            this._stackToEntry[err] = entry;
        }
        entry.count += 1;

        // Suppress if reported recently.
        const age = now - entry.timestamp;
        if (age > 0 && age < 300) {
            return;
        }
        // Suppress if keeps happening, should have enough data from earlier reports.
        if (entry.reportCount > 3) {
            return;
        }
        entry.timestamp = now;
        entry.reportCount += 1;

        // Send the error.
        const fetchOptions = {
            headers: { "Content-type": "application/json;charset=UTF-8" },
            body: "```" + JSON.stringify(entry, null, 2) + "```",
            method: "POST",
        };
        const promise = fetch(REPORT_URL, fetchOptions);
        promise.then((res) => console.log(JSON.stringify(res.json())));
    }
}

if (!world.__isMock) {
    console.log("ErrorReporting registering global handler");
    // eslint-disable-next-line no-undef
    $uncaughtException = (err) => {
        world.TI4.errorReporting.error(err);
    };
}

// Optionally test on load.
const THROW_ERROR_TESTING = false;
if (!world.__isMock && THROW_ERROR_TESTING) {
    // Throw from a fresh context.
    process.nextTick(() => {
        throw new Error("test normal throw");
    });
}

const THROW_DELEGATE_TESTING = false;
if (THROW_DELEGATE_TESTING) {
    const onErr = (exception) => {
        world.TI4.errorReporting.error(exception.stack);
    };
    const x = new TriggerableMulticastDelegate(onErr);
    x.add(() => {
        throw new Error("delegate failed");
    });
    process.nextTick(() => {
        x.trigger();
    });
}

module.exports = { ErrorReporting };
