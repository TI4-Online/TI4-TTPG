const assert = require("../../wrapper/assert-wrapper");
const { globalEvents } = require("../../wrapper/api");

class PerfStats {
    constructor(historySize) {
        assert(typeof historySize === "number" && historySize > 0);

        this._tick = 0;
        this._tickDurationUsecsHistory = [];

        globalEvents.onTick.add((prevTickDurationMsecs) => {
            const usecs = prevTickDurationMsecs * 1000;
            this._tick += 1;
            this._tickDurationUsecsHistory.push(usecs);
            if (this._tickDurationUsecsHistory.length > historySize) {
                this._tickDurationUsecsHistory.shift();
            }
        });
    }

    getTick() {
        return this._tick;
    }

    summarize() {
        const array = this._tickDurationUsecsHistory;
        const n = array.length;
        const mean = array.reduce((a, b) => a + b) / n;
        const stdDev = Math.sqrt(
            array.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n
        );
        const sorted = [...array].sort((a, b) => b - a);
        const median = sorted[sorted.length / 2];

        return {
            median,
            mean,
            stdDev,
        };
    }
}

module.exports = { PerfStats };
