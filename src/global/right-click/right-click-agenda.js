const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { DealDiscard } = require("../../lib/card/deal-discard");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { Card, globalEvents, world } = require("../../wrapper/api");

function _placeAgenda(agendaCard, onTop) {
    assert(agendaCard instanceof Card);
    assert(typeof onTop === "boolean");

    const deck = DealDiscard.getDeckWithReshuffle("card.agenda");
    if (!deck) {
        return;
    }
    assert(deck instanceof Card);
    const toFront = !onTop;
    const offset = 0;
    const animate = true;
    const flipped = false;
    deck.addCards(agendaCard, toFront, offset, animate, flipped);
}

function addRightClickOptions(agendaCard) {
    assert(agendaCard instanceof Card);
    const namesAndActions = [
        {
            name: locale("ui.menu.place_agenda_top"),
            action: (player) => {
                _placeAgenda(agendaCard, true);
            },
        },
        {
            name: locale("ui.menu.place_agenda_bottom"),
            action: (player) => {
                _placeAgenda(agendaCard, false);
            },
        },
    ];

    // Add as right-click options.
    for (const nameAndAction of namesAndActions) {
        agendaCard.addCustomAction("*" + nameAndAction.name);
    }
    agendaCard.onCustomAction.add((obj, player, actionName) => {
        for (const nameAndAction of namesAndActions) {
            if ("*" + nameAndAction.name === actionName) {
                nameAndAction.action(player);
                break;
            }
        }
    });
}

globalEvents.onObjectCreated.add((obj) => {
    const nsid = ObjectNamespace.getNsid(obj);
    if (nsid.startsWith("card.agenda")) {
        addRightClickOptions(obj);
    }
});

// Script reload doesn't call onObjectCreated on existing objects, load manually.
if (world.getExecutionReason() === "ScriptReload") {
    for (const obj of world.getAllObjects()) {
        const nsid = ObjectNamespace.getNsid(obj);
        if (nsid.startsWith("card.agenda")) {
            addRightClickOptions(obj);
        }
    }
}
