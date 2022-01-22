// Use the real TTPG api when available, otherwise mock.
// Usage: const { Vector } = require('./wrapper/api')
try {
    module.exports = require('@tabletop-playground/api')
} catch {
    Object.assign(module.exports, require('../mock/mock-game-world'))
    Object.assign(module.exports, require('../mock/mock-global-scripting-events'))
    Object.assign(module.exports, require('../mock/mock-player'))
    Object.assign(module.exports, require('../mock/mock-vector'))
}
