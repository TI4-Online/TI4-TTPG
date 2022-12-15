const assert = require("../wrapper/assert-wrapper");

/**
 * Lookalike for TTPG's MulticastDelegate, but with a trigger method.
 *
 * Callback exceptions log to console (or get routed to an optional exception
 * handler).  If a callback throws an exception other callbacks still run.
 */
class TriggerableMulticastDelegate {
    /**
     * Constructor.
     *
     * @param {function} exceptionHandler - optional exception handler
     */
    constructor(exceptionHandler) {
        assert(!exceptionHandler || typeof exceptionHandler === "function");
        this._delegates = [];
        this._exceptionHandler = exceptionHandler;
    }

    /**
     * Add a function to call.
     *
     * When called multiple times, all added functions will be called.
     *
     * @param {function} f
     */
    add(f) {
        assert(typeof f === "function");
        this._delegates.push(f);
    }

    /**
     * Clear the callback so no function will get called.
     */
    clear() {
        this._delegates = [];
    }

    /**
     * Remove the given function from the callback.
     *
     * Does nothing if the function is not set as callback.
     *
     * @param {function} f
     */
    remove(f) {
        assert(typeof f === "function");
        this._delegates = this._delegates.filter((x) => {
            return x != f;
        });
    }

    /**
     * Call listeners.
     *
     * Exceptions get routed to the optional exception handler, or logged to console if none.
     * If a callback throws an exception other callbacks still run.
     *
     * @param  {...any} args - variable parameters passed to each listener.
     */
    trigger(...args) {
        for (const f of this._delegates) {
            try {
                f(...args);
            } catch (exception) {
                if (this._exceptionHandler) {
                    this._exceptionHandler(exception);
                } else {
                    console.log(
                        `TriggerableMulticastDelegate.trigger error: ${exception.stack}`
                    );
                }
            }
        }
    }
}

module.exports = TriggerableMulticastDelegate;
