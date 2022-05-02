const assert = require("../../wrapper/assert-wrapper");

/**
 * Run tasks gradually, spreading load over time.
 */
class AsyncTaskQueue {
    constructor(delayMsecs) {
        this._delayMsecs = delayMsecs ? delayMsecs : 100;
        this._queue = [];
        this._processNextHandle = undefined;
    }

    add(task) {
        assert(typeof task === "function");
        this._queue.push(task);
        this._scheduleService();
    }

    cancel() {
        this._queue = [];
        if (this._processNextHandle) {
            clearTimeout(this._processNextHandle);
            this._processNextHandle = undefined;
        }
    }

    _scheduleService() {
        if (this._processNextHandle) {
            return; // already pending
        }
        this._processNextHandle = setTimeout(() => {
            this._processNextHandle = undefined;
            this._service();
        }, this._delayMsecs);
    }

    _service() {
        const task = this._queue.shift();
        if (!task) {
            return;
        }
        task();
        this._scheduleService();
    }
}

module.exports = { AsyncTaskQueue };
