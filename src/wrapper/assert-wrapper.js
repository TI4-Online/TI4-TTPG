// The node modules "assert" is broken.  Use this instead.
// Usage: const assert = require('./wrapper/assert')
module.exports = (test, message) => {
    if (!test) {
        //console.log(new Error().stack);
        throw new Error(message ? message : "assertion failed");
    }
    return test;
};
