const assert = require("../../wrapper/assert-wrapper");
const { Player, globalEvents } = require("../../wrapper/api");
const { Broadcast } = require("../broadcast");

class PerfStats {
    constructor(historySize = 180) {
        assert(typeof historySize === "number" && historySize > 0);

        this._tick = 0;
        this._tickDurationMsecsHistory = [];
        this._reportHandle = undefined;

        this._lastMsecs = 0;

        globalEvents.onTick.add((prevTickDurationSecs) => {
            const msecs = prevTickDurationSecs * 1000;
            this._tick += 1;
            this._tickDurationMsecsHistory.push(msecs);
            if (this._tickDurationMsecsHistory.length > historySize) {
                this._tickDurationMsecsHistory.shift();
            }
        });
    }

    isReporting() {
        return this._reportHandle ? true : false;
    }

    startReporting(player, reportIntervalMsecs) {
        assert(player instanceof Player);
        assert(typeof reportIntervalMsecs === "number");
        assert(reportIntervalMsecs > 10);
        this.stopReporting();
        this._reportHandle = setInterval(() => {
            const msg = this.summarizeStr();
            const color = [1, 1, 0];
            Broadcast.chatOne(player, msg, color);
        }, reportIntervalMsecs);
    }

    stopReporting() {
        if (this._reportHandle) {
            clearInterval(this._reportHandle);
            this._reportHandle = undefined;
        }
    }

    getTick() {
        return this._tick;
    }

    summarize() {
        const array = this._tickDurationMsecsHistory;
        const n = array.length;
        const mean = array.reduce((a, b) => a + b) / n;
        const stdDev = Math.sqrt(
            array.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n
        );
        const sorted = [...array].sort((a, b) => b - a);
        const median = sorted[Math.floor(sorted.length / 2)];

        // Mean of values within stdDev
        let scrubbed = sorted.filter(
            (x) => x > mean - stdDev && x < mean + stdDev
        );
        scrubbed = scrubbed.reduce((a, b) => a + b) / scrubbed.length;

        return {
            median,
            mean,
            scrubbed,
            stdDev,
        };
    }

    summarizeStr() {
        let { median, mean, scrubbed, stdDev } = this.summarize();
        median = median.toFixed(1);
        mean = mean.toFixed(1);
        scrubbed = scrubbed.toFixed(1);
        stdDev = stdDev.toFixed(2);
        return `frame msecs: median=${median} mean=${mean} scrubbed=${scrubbed} stdDev=${stdDev}`;
    }
}

module.exports = { PerfStats };
