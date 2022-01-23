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
 * - takeAtEnforceSingleton()
 */

const assert = require('../wrapper/assert')
const { globalEvents, world } = require('@tabletop-playground/api')

function isInfiniteContainer(obj) {
    const infiniteTypes = [ 1, 3 ]
    return (obj instanceof Container) && infiniteTypes.includes(obj.getType())
}

/**
 * Container.addObjects lookalike patched onto infinite container objects.
 * 
 * Puts into empty container or of same object there succeed.
 * Container is pruned down to one item afterward.
 * Puts of a different object throw an error.
 * 
 * @param {GameObject[]} insertObjs - Objects to insert
 * @param {number} index - The index at which the new objects will be inserted. By default, they will be inserted at start (index 0)
 * @param {boolean} showAnimation - If false, don't show insert animation and don't play sound. Default: false
 */
function addObjectsEnforceSingleton(insertObjs, index, showAnimation) {
    assert(isInfiniteContainer(this))
    assert(insertObjs.length > 0)

    // If the container is empty add the first object.
    if (this.getItems().length == 0) {
        this.addObjects([ insertObjs[0] ], 0, showAnimation)
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
}

/**
 * Container.take lookalike patched onto infinite container objects.
 * 
 * Remove an item from the container, move it to the provided position, and
 * return whether it was removed.  Unlike the normal Container.take, this 
 * version preserves the copy in the container.
 * 
 * Note that the GUID of the contained object changes.
 * 
 * @param {GameObject} objectToRemove 
 * @param {Vector} position - The position where the item should appear
 * @param {boolean} showAnimation - If false, don't show insert animation and don't play sound. Default: false
 * @returns {boolean}
 */
function takeEnforceSingleton(objectToRemove, position, showAnimation) {
    assert(isInfiniteContainer(this))
    if (!this.take(objectToRemove, position, showAnimation)) {
        return false
    }
    const json = objectToRemove.toJSONString()
    let pos = this.getPosition()
    pos = pos.add(this.getExtent().multiply(2))
    pos = pos.add(objectToRemove.getExtent().multiply(2))
    const clone = world.createObjectFromJSON(json, pos)
    if (clone) {
        this.addObjects([ clone ], 0, false)
    }
    return true
}

/**
 * Container.takeAt lookalike patched onto infinite container objects.
 * 
 * Remove an item from the container, move it to the provided position, and
 * return whether it was removed.  Unlike the normal Container.take, this 
 * version preserves the copy in the container.
 *
 * @param {number} index - The index of the object to take
 * @param {Vector} position - The position where the item should appear
 * @param {boolean} showAnimation - If false, don't show insert animation and don't play sound. Default: false
 * @returns {boolean}
 */
function takeAtEnforceSingleton(index, position, showAnimation) {
    assert(isInfiniteContainer(this))
    const containedObjs = this.getItems()
    if (containedObjs.length == 0) {
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

    // Reject mismatched items and delete extra corrent ones.
    for (const containedObj of containedObjs) {
        if (containedObj.getTemplateId() !== masterTemplateId) {
            // Mismatch.
            const pos = container.getPosition().add([10, 0, 10])
            container.take(containedObj, pos, true)
        } else if (containedObj != masterObject) {
            // Redundant extra.
            container.remove(containedObj)
        }
    }
}

// ----------------------------------------------------------------------------

// Patch infinite containers at load / onObjectCreated time.
function patchInfiniteContainer(obj) {
    // Monitor inserts.
    obj.onInserted.add(onInsertedEnforceSingleton)

    // New methods other scripts can call.
    obj.addObjectsEnforceSingleton = addObjectsEnforceSingleton
    obj.takeEnforceSingleton = takeEnforceSingleton
    obj.takeAtEnforceSingleton = takeAtEnforceSingleton
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

