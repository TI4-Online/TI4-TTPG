/**
 * Lookalike for TTPG's MulticastDelegate, but with a trigger method.
 */
class TriggerableMulticastDelegate {
    constructor(exceptionHandler) {
        this._delegates = []
        this._exceptionHandler = exceptionHandler ? exceptionHandler : console.warn
    }

	/** Add a function to call. When called multiple times, all added functions will be called. */
    add(f) {
        this._delegates.push(f)
    }

	/** Clear the callback so no function will get called. */
    clear() {
        this._delegates = []
    }

    /** Remove the given function from the callback. Doesn't do anything if the function is not set as callback. */
    remove(f) {
        this._delegates = this._delegates.filter(x => { return x != f })
    }

    trigger(...args) {
        for (const f of this._delegates) {
            try {
                f(...args)
            } catch (exception) {
                this._exceptionHandler(exception)
            }
        }
    }
}

module.exports = {
    TriggerableMulticastDelegate
}