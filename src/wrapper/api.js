// Use the real TTPG api when available, otherwise mock.
// Usage: const { Vector } = require('./wrapper/api')
try {
    module.exports = require('@tabletop-playground/api')
} catch {
    Object.assign(module.exports, require('../mock/MockVector'))
}
