const assert = require("../../wrapper/assert-wrapper");
const { Player, globalEvents } = require("../../wrapper/api");
const { Broadcast } = require("../broadcast");

class PerfStats {
    constructor(historySize = 60) {
        assert(typeof historySize === "number" && historySize > 0);

        this._historySize = historySize;
        this._tick = 0;
        this._tickDurationMsecsHistory = Array(historySize).map(() => 0);
        this._reportHandle = undefined;

        globalEvents.onTick.add((prevTickDurationSecs) => {
            this._onTickHandler(prevTickDurationSecs);
        });
    }

    _onTickHandler(prevTickDurationSecs) {
        this._tick += 1;
        // Update in a fixed size window rather than push/shift.
        const idx = this._tick % this._tickDurationMsecsHistory.length;
        const msecs = prevTickDurationSecs * 1000;
        this._tickDurationMsecsHistory[idx] = msecs;
    }

    getHistorySize() {
        return this._historySize;
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
        const mean = array.reduce((a, b) => a + b, 0) / n;
        const stdDev = Math.sqrt(
            array.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n
        );
        const sorted = [...array].sort((a, b) => b - a);
        const median = sorted[Math.floor(sorted.length / 2)];

        // Mean of values within 3x stdDev
        const tolerance = stdDev * 3;
        let scrubbed = sorted.filter(
            (x) => x > mean - tolerance && x < mean + tolerance
        );
        scrubbed = scrubbed.reduce((a, b) => a + b, 0) / scrubbed.length;

        const fps = 1000 / scrubbed; // scrubbed

        // Round to 3 decimal places for cleaner log / json.
        return {
            median: Math.floor(median * 1000) / 1000,
            mean: Math.floor(mean * 1000) / 1000,
            scrubbed: Math.floor(scrubbed * 1000) / 1000,
            stdDev: Math.floor(stdDev * 1000) / 1000,
            fps: Math.floor(fps * 1000) / 1000,
        };
    }

    summarizeStr() {
        let { median, mean, scrubbed, stdDev, fps } = this.summarize();
        median = median.toFixed(1);
        mean = mean.toFixed(1);
        scrubbed = scrubbed.toFixed(1);
        stdDev = stdDev.toFixed(2);
        fps = fps.toFixed(1);
        return `frame msecs: median=${median} mean=${mean} scrubbed=${scrubbed} stdDev=${stdDev} [${fps}]`;
    }
}

module.exports = { PerfStats };
