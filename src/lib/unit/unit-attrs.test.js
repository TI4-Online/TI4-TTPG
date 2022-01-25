const assert = require('assert')
const { UnitAttrsSchema } = require('./unit-attrs-schema')
const {
    BASE_UNIT,
    UNIT_UPGRADE,
} = require('./unit-attrs')

it('validate BASE_UNIT schema', () => {
    for (const [unitName, unitAttrs] of Object.entries(BASE_UNIT)) {
        const isValid = UnitAttrsSchema.validate(unitAttrs)
        assert(isValid, `rejected ${unitName} BASE_UNIT schema`)
    }
})

it('validate UNIT_UPGRADE schema', () => {
    for (const [unitName, unitAttrs] of Object.entries(UNIT_UPGRADE)) {
        const isValid = UnitAttrsSchema.validate(unitAttrs)
        assert(isValid, `rejected ${unitName} UNIT_UPGRADE schema`)
    }
})