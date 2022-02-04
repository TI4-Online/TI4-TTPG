/**
 * Some finite bags may only hold matching objects (command tokens, etc).
 */
const { globalEvents, world } = require("../wrapper/api");
const { ObjectNamespace } = require("../lib/object-namespace");

const REJECT_REASON = {
    BAG_PARSE: "bag parse failed",
    INSERTED_PARSE: "inserted parse failed",
    MISMATCH_OWNER: "mismatch owner",
    MISMATCH_TYPE: "mismatch type",
    MISMATCH_NAME: "mismatch name",
};

/**
 * Why can't item go into this bag?  Return false if it can.
 *
 * @param {GameObject} bagObj
 * @param {GameObject} insertedObj
 * @returns {REJECT_REASON} why rejected, or false if accepted
 */
function getRejectReason(bagObj, insertedObj) {
    // Reject if not a nsid bag or insert obj.
    const bagParsed = ObjectNamespace.parseGeneric(bagObj);
    if (!bagParsed) {
        return REJECT_REASON.BAG_PARSE;
    }
    const insertedParsed = ObjectNamespace.parseGeneric(insertedObj);
    if (!insertedParsed) {
        return REJECT_REASON.INSERTED_PARSE;
    }

    // Reject if either has an owner and wrong owner.
    if (bagObj.getOwningPlayerSlot() != insertedObj.getOwningPlayerSlot()) {
        return REJECT_REASON.MISMATCH_OWNER;
    }

    // Reject if type mismatch, bags MUST prefix "bag." in NSID type.
    if (bagParsed.type !== "bag." + insertedParsed.type) {
        return REJECT_REASON.MISMATCH_TYPE;
    }

    // Reject if name mismatch.
    if (bagParsed.name !== insertedParsed.name) {
        return REJECT_REASON.MISMATCH_NAME;
    }

    // All clear!
    return false;
}

/**
 * Container.addObjects lookalike patched onto exclusive container objects.
 *
 * Puts of a different object throw an error.
 *
 * @param {GameObject[]} insertObjs - Objects to insert
 * @param {number} index - The index at which the new objects will be inserted. By default, they will be inserted at start (index 0)
 * @param {boolean} showAnimation - If false, don't show insert animation and don't play sound. Default: false
 */
function addObjectsExclusiveBag(insertObjs, index, showAnimation) {
    for (const insertObj of insertObjs) {
        const rejectReason = getRejectReason(this, insertObj);
        if (rejectReason) {
            // This was called by a script, the script should be fixed to add only legal items.
            throw new Error(`addObjects rejected: ${rejectReason}`);
        }
    }
    this.__addObjectsRaw(insertObjs, index, showAnimation);
}

// Container.onInserted event handler.
function onInsertedExclusiveBag(container, insertObjs, player) {
    for (const insertObj of insertObjs) {
        const rejectReason = getRejectReason(container, insertObj);
        if (rejectReason) {
            // Player dropped a non-matching item into an exclusive bag.
            //console.log(`onInsertedExclusiveBag: reject ${rejectReason}`);
            const pos = container.getPosition().add([10, 0, 10]);
            container.take(insertObj, pos, true);
        }
    }
}

// ----------------------------------------------------------------------------

function isPatchCandidate(obj) {
    if (ObjectNamespace.isUnitBag(obj)) {
        return true;
    }
    if (ObjectNamespace.isCommandTokenBag(obj)) {
        return true;
    }
    return false;
}

// Patch infinite containers at load / onObjectCreated time.
function patchExclusiveBag(obj) {
    // Monitor inserts.
    obj.onInserted.add(onInsertedExclusiveBag);

    // Interpose on addObjects, preserves Container.addObjects behavior.
    obj.__addObjectsRaw = obj.addObjects;
    obj.addObjects = addObjectsExclusiveBag;
}

// Add our listener to future objects.
globalEvents.onObjectCreated.add((obj) => {
    if (isPatchCandidate(obj)) {
        patchExclusiveBag(obj);
    }
});

// Script reload doesn't onObjectCreated existing objects, load manually.
if (world.getExecutionReason() === "ScriptReload") {
    for (const obj of world.getAllObjects()) {
        if (isPatchCandidate(obj)) {
            patchExclusiveBag(obj);
        }
    }
}

// Export for unit test.
module.exports = {
    REJECT_REASON,
    getRejectReason,
};
