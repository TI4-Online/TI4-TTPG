// Temporary workaround for TTPG/MacOS require node_modules bug.
// Remove this when TTPG fixes it, fix requires to use real assert.
// Usage: const assert = require('./wrapper/assert')
let assert = false
try {
    assert = require('assert')
} catch {
    // nop (assert is empty, above require returns undefined and does not throw)
}
module.exports = assert ? assert : (test, message) => {
    if (!test) {
        throw new Error(message ? message : 'assertion failed')
    }
}
