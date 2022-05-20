const { CardUtil } = require("../lib/card/card-util");
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
        // Can call this without a container to trash on-table objects.
        if (container && rejectedObj.getContainer() != container) {
            continue; // object no longer in the container?  skip.
        }

        // Held objects can be put into decks or containers, but not moved.
        // Break the hold before continuing.
        if (!container && rejectedObj.isHeld()) {
            rejectedObj.release();
        }

        const nsid = ObjectNamespace.getNsid(rejectedObj);
        const parsed = ObjectNamespace.parseNsid(nsid);
        //console.log(`onContainerRejected "${nsid}"`);

        // If this is a card or deck attempt to discard each.
        if (rejectedObj instanceof Card) {
            if (container) {
                const pos = container.getPosition().add([10, 0, 10]);
                container.take(rejectedObj, pos, false, false);
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
            continue;
        }

        // Strategy Card
        if (ObjectNamespace.isStrategyCard(rejectedObj)) {
            if (container) {
                const pos = container.getPosition().add([10, 0, 10]);
                container.take(rejectedObj, pos, false, false);
            }

            EndStatusPhase.returnStrategyCard(rejectedObj);
            continue;
        }

        // TODO XXX Attachment token

        // Faction Extras
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
        const factionDesk = nsidToFactionDesk[nsid];
        if (factionDesk) {
            if (container) {
                const pos = container.getPosition().add([10, 0, 10]);
                container.take(rejectedObj, pos, false, false);
            }
            rejectedObj.setPosition(factionDesk.center.add([0, 0, 10]));
            continue;
        }

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
            if (container) {
                const pos = container.getPosition().add([10, 0, 10]);
                container.take(rejectedObj, pos, true, false);
            }
        }
    }
});
