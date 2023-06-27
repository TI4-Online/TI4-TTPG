const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { Card, Player, globalEvents, world } = require("../../wrapper/api");
const { Broadcast } = require("../../lib/broadcast");

const REPORT_REMAINING_NSID_PREFIXES = ["card.exploration", "card.relic"];

function isReportRemaining(obj) {
    if (!(obj instanceof Card)) {
        return false;
    }
    if (obj.getStackSize() <= 1) {
        return false;
    }
    // ALL cards must belong to add option (otherwise dropping a secret on the
    // wrong pile could leak it).
    const nsids = ObjectNamespace.getDeckNsids(obj);
    for (const nsid of nsids) {
        let anyMatched = false;
        for (const prefix of REPORT_REMAINING_NSID_PREFIXES) {
            if (nsid.startsWith(prefix)) {
                anyMatched = true;
                break;
            }
        }
        if (!anyMatched) {
            return false;
        }
    }
    return true;
}

function doReportRemaining(cardOrDeck, player) {
    assert(cardOrDeck instanceof Card);
    assert(player instanceof Player);

    // Make sure this deck is *still* a candidate.
    if (!isReportRemaining(cardOrDeck)) {
        return;
    }

    const nameToCount = {};
    cardOrDeck.getAllCardDetails().forEach((cardDetails) => {
        let name = cardDetails.name;
        name = name.replace(/ \([0-9]+\)$/, ""); // strip trailing "(#)"
        nameToCount[name] = (nameToCount[name] || 0) + 1;
    });

    let result = [];
    Object.keys(nameToCount)
        .sort()
        .forEach((name) => {
            const count = nameToCount[name];
            if (count > 1) {
                result.push(`${name} (${count})`);
            } else {
                result.push(name);
            }
        });
    result = result.join(", ");
    result = `${locale("ui.context.report_remaining")}: ${result}`;

    Broadcast.chatOne(player, result);
}

function maybeDoReportRemaining(obj, player, selectedActionName) {
    const actionName = "*" + locale("ui.context.report_remaining");
    if (selectedActionName === actionName) {
        doReportRemaining(obj, player);
    }
}

function addRightClickReportRemaining(cardOrDeck) {
    assert(cardOrDeck instanceof Card);

    if (cardOrDeck.__hasRightClickReportRemaining) {
        return; // already has it
    }

    // Add right-click option.
    const actionName = "*" + locale("ui.context.report_remaining");
    cardOrDeck.addCustomAction(actionName);
    cardOrDeck.onCustomAction.remove(maybeDoReportRemaining);
    cardOrDeck.onCustomAction.add(maybeDoReportRemaining);
    cardOrDeck.__hasRightClickReportRemaining = true;
}

function removeRightReportRemaining(cardOrDeck) {
    assert(cardOrDeck instanceof Card);

    const actionName = "*" + locale("ui.context.report_remaining");
    cardOrDeck.removeCustomAction(actionName);
    cardOrDeck.onCustomAction.remove(maybeDoReportRemaining);
    cardOrDeck.__hasRightClickReportRemaining = false;
}

globalEvents.TI4.onSingletonCardCreated.add((card) => {
    assert(card instanceof Card);
    removeRightReportRemaining(card);
});

globalEvents.TI4.onSingletonCardMadeDeck.add((card) => {
    assert(card instanceof Card);
    if (isReportRemaining(card)) {
        addRightClickReportRemaining(card);
    }
});

globalEvents.onObjectCreated.add((obj) => {
    if (obj instanceof Card && isReportRemaining(obj)) {
        addRightClickReportRemaining(obj);
    }
});

for (const obj of world.getAllObjects()) {
    if (isReportRemaining(obj)) {
        addRightClickReportRemaining(obj);
    }
}
