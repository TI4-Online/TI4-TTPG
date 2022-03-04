const { CardUtil } = require("../lib/card/card-util");
const { CloneReplace } = require("../lib/clone-replace");
const { DealDiscard } = require("../lib/card/deal-discard");
const { ObjectNamespace } = require("../lib/object-namespace");
const { Card, Container, globalEvents, world } = require("../wrapper/api");
const { EndStatusPhase } = require("../lib/phase/end-of-round");

/**
 * Handler for globalEvents.TI4.onContainerRejected
 * For the moment, just remove rejected objects.
 */
globalEvents.TI4.onContainerRejected.add((container, rejectedObjs, player) => {
    for (let rejectedObj of rejectedObjs) {
        if (rejectedObj.getContainer() != container) {
            continue; // object no longer in the container?  skip.
        }
        const nsid = ObjectNamespace.getNsid(rejectedObj);
        const parsed = ObjectNamespace.parseNsid(nsid);
        //console.log(`onContainerRejected "${nsid}"`);

        // If this is a card or deck attempt to discard each.
        if (rejectedObj instanceof Card) {
            const pos = container.getPosition().add([10, 0, 10]);
            container.take(rejectedObj, pos, false, false);

            // Temporary workaround for TTPG bug.
            rejectedObj = CloneReplace.cloneReplace(rejectedObj);

            const cards = CardUtil.separateDeck(rejectedObj);
            const bad = [];
            for (const card of cards) {
                if (!DealDiscard.discard(card)) {
                    console.log(
                        `onContainerRejected: unknown card ${ObjectNamespace.getNsid(
                            card
                        )}`
                    );
                    bad.push(card);
                }
            }
            CardUtil.makeDeck(bad);
            continue;
        }

        // Strategy Card
        if (ObjectNamespace.isStrategyCard(rejectedObj)) {
            const pos = container.getPosition().add([10, 0, 10]);
            container.take(rejectedObj, pos, false, false);

            // Temporary workaround for TTPG bug.
            rejectedObj = CloneReplace.cloneReplace(rejectedObj);

            EndStatusPhase.returnStrategyCard(rejectedObj);
            continue;
        }

        // TODO XXX Attachment token

        // TODO XXX Faction Extra

        // Try to find a home (bag with NSID bag.$type and $name).
        if (parsed.type == "token.command") {
            parsed.source = "base";
            parsed.name = "*";
        } else if (parsed.type == "token.control") {
            parsed.source = "base";
            parsed.name = "*";
        }
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
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid !== bagNsid) {
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
            container.take(rejectedObj, pos, true, false);

            // Temporary workaround for TTPG bug.
            rejectedObj = CloneReplace.cloneReplace(rejectedObj);
        }
    }
});
