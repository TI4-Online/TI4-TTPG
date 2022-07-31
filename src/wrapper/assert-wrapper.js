// The node modules "assert" is broken.  Use this instead.
// Usage: const assert = require('./wrapper/assert')
const assert = (test, message) => {
    if (!test) {
        //console.log(new Error().stack);
        throw new Error(message ? message : "assertion failed");
    }
    return test;
};

assert.equal = (a, b) => {
    if (a !== b) {
        throw new Error(`assert.equal got "${a}" expected "${b}"`);
    }
};

module.exports = assert;
