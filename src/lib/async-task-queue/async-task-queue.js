const assert = require("../../wrapper/assert-wrapper");

const DEFAULT_ASYNC_DELAY = 100;

/**
 * Run tasks gradually, spreading load over time.
 */
class AsyncTaskQueue {
    constructor(delayMsecs, exceptionHandler) {
        assert(!delayMsecs || typeof delayMsecs === "number");
        assert(!exceptionHandler || typeof exceptionHandler === "function");

        this._delayMsecs = delayMsecs ? delayMsecs : DEFAULT_ASYNC_DELAY;
        this._exceptionHandler = exceptionHandler;
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
        try {
            task();
        } catch (exception) {
            if (this._exceptionHandler) {
                this._exceptionHandler(exception);
            } else {
                console.warn(exception.stack);
            }
        }
        this._scheduleService();
    }
}

module.exports = { AsyncTaskQueue, DEFAULT_ASYNC_DELAY };
