const assert = require('assert')
const locale = require('../lib/locale')
const UNIT_BAGS = require('./unit-bags.data')

it('UNIT_BAGS localeName', () => {
    for (const unitBag of UNIT_BAGS) {
        const assertLocaleKey = (localKey) => {
            const s = locale(localKey)
            if (s === localKey) {
                console.error(unitBag)
            }
            assert(s !== localKey) // yarn dev to (re)build lang
        }
        assertLocaleKey(unitBag.localeName)
    }
})