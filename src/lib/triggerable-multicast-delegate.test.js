const TriggerableMulticastDelegate = require('./triggerable-multicast-delegate')
const assert = require('assert')

it('require', () => {
    assert(TriggerableMulticastDelegate)
})

it('constructor', () => {
    new TriggerableMulticastDelegate()
})

it('add', () => {
    const tmd = new TriggerableMulticastDelegate()
    tmd.add(x => {})
})

it('remove', () => {
    const tmd = new TriggerableMulticastDelegate()
    tmd.remove(x => {})
})

it('clear', () => {
    const tmd = new TriggerableMulticastDelegate()
    tmd.clear()
})

it('invoke trigger', () => {
    // Verify multiple arguments work, sum in result.
    let result = false
    const f = (a, b) => { result = a + b }

    const tmd = new TriggerableMulticastDelegate()
    tmd.add(f)

    // Verify trigger calls the handler.
    tmd.trigger(2, 3)
    assert.equal(result, 5)

    // Verify remove does not trigger again.
    tmd.remove(f)
    tmd.trigger(4, 5)
    assert.equal(result, 5) // old value
})

it('exception handler', () => {
    let exceptions = []
    const expetionHandler = e => { exceptions.push(e) }
    const tmd = new TriggerableMulticastDelegate(expetionHandler)

    // Register multiple functions, all should be called even if an execption.
    tmd.add(() => { throw 'poo1' })
    tmd.add(() => { throw 'poo2' })

    assert.equal(exceptions.length, 0)
    tmd.trigger()
    assert.equal(exceptions.length, 2)
})
