const { ObjectNamespace } = require("../lib/object-namespace");
const { Container, globalEvents, world } = require("../wrapper/api");

/**
 * Handler for globalEvents.TI4.onContainerRejected
 * For the moment, just remove rejected objects.
 */
globalEvents.TI4.onContainerRejected.add((container, rejectedObjs, player) => {
    for (const rejectedObj of rejectedObjs) {
        if (rejectedObj.getContainer() != container) {
            continue; // object no longer in the container?  skip.
        }

        // Try to find a home (bag with NSID bag.$type and $name).
        // Do not attempt to find discard piles for cards, etc (yet).
        const parsed = ObjectNamespace.parseGeneric(rejectedObj);
        const bagNsid = `bag.${parsed.type}:${parsed.source}/${parsed.name}`;
        const bagOwner = rejectedObj.getOwningPlayerSlot();
        let rehomed = false;
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue; // ignore candidates inside containers
            }
            if (!(obj instanceof Container)) {
                continue; // only consider containers
            }
            if (ObjectNamespace.getNsid(obj) !== bagNsid) {
                continue; // wrong type
            }
            if (obj.getOwningPlayerSlot() !== bagOwner) {
                continue; // wrong owner
            }
            // Found a home!  Send item there.
            obj.addObjects([rejectedObj], 0, true);
            rehomed = true;
            break;
        }

        // Was not able to move it, just pop it out for now.
        if (!rehomed) {
            const pos = container.getPosition().add([10, 0, 10]);
            container.take(rejectedObj, pos, true);
        }
    }
});
