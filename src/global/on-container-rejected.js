const { CardUtil } = require("../lib/card/card-util");
const { DealDiscard } = require("../lib/card/deal-discard");
const { ObjectNamespace } = require("../lib/object-namespace");
const { Card, Container, globalEvents, world } = require("../wrapper/api");
const { EndStatusPhase } = require("../lib/phase/end-of-round");

const DESTROY_SET = new Set([
    "token:base/fighter_1",
    "token:base/fighter_3",
    "token:base/infantry_1",
    "token:base/infantry_3",
    "token:base/tradegood_commodity_1",
    "token:base/tradegood_commodity_3",
    "token:pok/frontier",
]);

function rejectCard(rejectedObj) {
    if (!(rejectedObj instanceof Card)) {
        return false;
    }
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
    return true;
}

function rejectStrategyCard(rejectedObj) {
    if (!ObjectNamespace.isStrategyCard(rejectedObj)) {
        return false;
    }
    EndStatusPhase.returnStrategyCard(rejectedObj);
    return true;
}

function rejectFactionExtra(rejectedObj) {
    const nsidToFactionDesk = {};
    for (const playerDesk of world.TI4.getAllPlayerDesks()) {
        const playerSlot = playerDesk.playerSlot;
        const faction = world.TI4.getFactionByPlayerSlot(playerSlot);
        if (!faction) {
            continue;
        }
        const unpackExtra = faction.raw.unpackExtra;
        if (!unpackExtra) {
            continue;
        }
        for (const extra of unpackExtra) {
            if (extra.tokenNsid) {
                nsidToFactionDesk[extra.tokenNsid] = playerDesk;
            }
        }
    }

    const nsid = ObjectNamespace.getNsid(rejectedObj);
    const factionDesk = nsidToFactionDesk[nsid];
    if (!factionDesk) {
        return false;
    }

    rejectedObj.setPosition(factionDesk.center.add([0, 0, 10]));
    return true;
}

function rejectDestroy(rejectedObj) {
    const nsid = ObjectNamespace.getNsid(rejectedObj);

    const destroy = DESTROY_SET.has(nsid) || nsid.startsWith("token.control:");

    if (!destroy) {
        return false;
    }
    // Actually do not need to return these, source is infinite bag.
    rejectedObj.setTags(["DELETED_ITEMS_IGNORE"]);
    rejectedObj.destroy();
    return true;
}

function rejectToMatchingBag(rejectedObj) {
    const nsid = ObjectNamespace.getNsid(rejectedObj);
    const parsed = ObjectNamespace.parseNsid(nsid);
    if (!parsed) {
        return false;
    }

    if (parsed.type == "token.command") {
        parsed.source = "base";
        parsed.name = "*";
    } else if (parsed.type == "token.control") {
        parsed.source = "base";
        parsed.name = "*";
    }
    const bagNsid = `bag.${parsed.type}:${parsed.source}/${parsed.name}`;
    const bagOwner = rejectedObj.getOwningPlayerSlot();
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

        // Special hook for Command Token bag insert reporting.
        // Others may use it as well.
        if (obj.__notifyInserted) {
            obj.__notifyInserted.trigger(obj, [rejectedObj]);
        }
        return true;
    }
    return false;
}

/**
 * Handler for globalEvents.TI4.onContainerRejected
 * For the moment, just remove rejected objects.
 */
globalEvents.TI4.onContainerRejected.add((container, rejectedObjs, player) => {
    for (let i = 0; i < rejectedObjs.length; i++) {
        const rejectedObj = rejectedObjs[i];

        // Can call this without a container to trash on-table objects.
        if (container && rejectedObj.getContainer() != container) {
            continue; // object no longer in the container?  skip.
        }

        // Held objects can be put into decks or containers, but not moved.
        // Break the hold before continuing.
        if (!container && rejectedObj.isHeld()) {
            rejectedObj.release();
        }

        // Otherwise always move to rejected spot (may move again later).
        // Adjust the pending spot since multiple things may move each frame.
        if (container) {
            const pos = container.getPosition().add([10, 0, 10 + i * 2]);
            container.take(rejectedObj, pos, false, false);
        }

        //const nsid = ObjectNamespace.getNsid(rejectedObj);
        //console.log(`onContainerRejected "${nsid}"`);

        if (rejectDestroy(rejectedObj)) {
            continue;
        }

        // If this is a card or deck attempt to discard each.
        if (rejectCard(rejectedObj)) {
            continue;
        }

        // Strategy Card
        if (rejectStrategyCard(rejectedObj)) {
            continue;
        }

        // TODO XXX Attachment token

        // Faction Extras
        if (rejectFactionExtra(rejectedObj)) {
            continue;
        }

        // Try to find a home (bag with NSID bag.$type and $name).
        if (rejectToMatchingBag(rejectedObj)) {
            continue;
        }
    }
});
