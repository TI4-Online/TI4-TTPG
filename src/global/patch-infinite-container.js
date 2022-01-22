/**
 * TTPG infinite containers have a few quirks compared to TTS style:
 * 
 * - They can gather multiple objects, which can be different.
 * - Players pull a copy, but container.take() removes item.
 * 
 * We want to support a "single item" infinite container that:
 * 
 * - Has exactly one item.
 * - Allows puts of identical items (discards down to one), rejects others.
 * - Scripts can take while preserving the single item inside.
 * 
 * This script enforces singleton infinite containers, and injects some new 
 * methods on infinite containers:
 * 
 * - addObjectsEnforceSingleton()
 * - takeEnforceSingleton()
 */

const assert = require('../wrapper/assert')
const { globalEvents, world } = require('../wrapper/api')
const { Vector } = require('../mock/mock-vector')

function isInfiniteContainer(obj) {
    const infiniteTypes = [ 1, 3 ]
    return (obj instanceof Container) && infiniteTypes.includes(obj.getType())
}

// New Container.addObjectsEnforceSingleton method.
function addObjectsEnforceSingleton(insertObjs, index, showAnimation) {
    assert(isInfiniteContainer(this))
    assert(insertObjs.length > 0)

    // If the container is empty add the first object.
    if (this.getItems().length == 0) {
        if (!this.addObjects([ insertObjs[0] ], 0, showAnimation)) {
            return false
        }
        insertObjs = insertObjs.slice(1)
    }

    // At this point container has at least one object.
    const masterObject = this.getItems()[0]
    const masterTemplateId = masterObject.getTemplateId()

    // Verify and destroy redundant extras.
    for (const insertObj of insertObjs) {
        if (insertObj.getTemplateId() !== masterTemplateId) {
            throw new Error('Container.addObjectsEnforceSingleton mismatch')
        }
        insertObj.destroy()
    }
    return true
}

// New Container.takeEnforceSingleton()
function takeEnforceSingleton(objectToRemove, position, showAnimation) {
    assert(isInfiniteContainer(this))
    if (this.take(objectToRemove, position, showAnimation)) {
        const json = objectToRemove.toJSONString()
        let pos = this.getPosition()
        pos = pos.add(this.getExtent().multiply(2))
        pos = pos.add(objectToRemove.getExtent().multiply(2))
        const clone = world.createObjectFromJSON(json, pos)
        if (clone) {
            this.addObjects([ clone ], 0, false)
        }
    }
}

// New Container.takeAtEnforceSingleton()
function takeAtEnforceSingleton(index, position, showAnimation) {
    assert(isInfiniteContainer(this))
    const containedObj = this.getItems()
    if (containedObj.length == 0) {
        return false
    }
    return this.takeEnforceSingleton(containedObjs[0], position, showAnimation)
}

// Container.onInserted event handler.
function onInsertedEnforceSingleton(container, insertedObjs, player) {
    assert(isInfiniteContainer(container))

    // When a player drops an object to a container it is added at the end.
    // Grab the template id from the first object to reject mismatches.
    const containedObjs = container.getItems()
    assert(containedObjs && containedObjs.length > 0)
    const masterObject = containedObjs[0]
    const masterTemplateId = masterObject.getTemplateId()
    console.log(`Infinite container onInsertedEnforceSingleton ${masterTemplateId}`)

    // Reject mismatched items and delete extra corrent ones.
    for (const containedObj of containedObjs) {
        if (containedObj.getTemplateId() !== masterTemplateId) {
            // Mismatch.
            console.log(`Infinite container mismatch: "${containedObj.getTemplateId()}"`)
            const pos = container.getPosition().add(new Vector(10, 0, 10))
            container.take(containedObj, pos, true)
        } else if (containedObj != masterObject) {
            // Redundant extra.
            console.log(`Infinite container pruning: "${containedObj.getTemplateId()}"`)
            container.remove(containedObj)
        }
    }
}

// ----------------------------------------------------------------------------

function patchInfiniteContainer(obj) {
    console.log('PATCHING CONTAINER')
    obj.onInserted.add(onInsertedEnforceSingleton)
    obj.addObjectsEnforceSingleton = addObjectsEnforceSingleton
}

// Add our listener to future objects.
globalEvents.onObjectCreated.add((obj) => {
    if (isInfiniteContainer(obj)) {
        patchInfiniteContainer(obj)
    }
})

// Script reload doesn't onObjectCreated existing objects, load manually.
if (world.getExecutionReason() === 'ScriptReload') {
    for (const obj of world.getAllObjects()) {
        if (isInfiniteContainer(obj)) {
            patchInfiniteContainer(obj)
        }
    }
}

