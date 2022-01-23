const assert = require('assert')
const { italic } = require('colorette')
const locale = require('./locale')

it('hellow world', () => {
    // "example.helloworld": "Hello World!"
    assert.equal(locale('example.helloworld'), 'Hello World!')
})