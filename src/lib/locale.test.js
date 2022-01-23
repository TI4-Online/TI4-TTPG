const assert = require('assert')
const locale = require('./locale')

it('does a basic replace', () => {
    // "example.helloworld": "Hello World!"
    assert.equal(locale('example.helloworld'), 'Hello World!')
})

it('handles pluralization', () => {
    //"example.replaced": "{player} has run this script {x} {#x|time|times|times... newb}"
    assert.equal(locale('example.replaced', { player: "ThatRobHuman", x: 0 }), 'ThatRobHuman has run this script 0 times... newb');
    assert.equal(locale('example.replaced', { player: "ThatRobHuman", x: 1 }), 'ThatRobHuman has run this script 1 time');
    assert.equal(locale('example.replaced', { player: "ThatRobHuman", x: 2 }), 'ThatRobHuman has run this script 2 times');
})
