const { world } = require("./api");

// The node modules "assert" is broken.  Use this instead.
// Usage: const assert = require('./wrapper/assert')
module.exports = (test, message) => {
    if (!test) {
        if (!world.__isMock) {
            // Come contexts do not print out a stack trace.
            // Do it manually.
            console.log(new Error().stack);
        }
        throw new Error(message ? message : "assertion failed");
    }
    return test;
};
