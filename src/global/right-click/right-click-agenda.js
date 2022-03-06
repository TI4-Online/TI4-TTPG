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

const NAMES_AND_ACTIONS = [
    {
        localeName: "ui.menu.place_agenda_top",
        placeTop: true,
    },
    {
        localeName: "ui.menu.place_agenda_bottom",
        placeTop: false,
    },
];

function addRightClickOptions(agendaCard) {
    assert(agendaCard instanceof Card);

    // Add as right-click options.
    for (const nameAndAction of NAMES_AND_ACTIONS) {
        const actionName = "*" + locale(nameAndAction.localeName);
        agendaCard.addCustomAction(actionName);
    }
    agendaCard.onCustomAction.add((obj, player, selectedActionName) => {
        for (const nameAndAction of NAMES_AND_ACTIONS) {
            const actionName = "*" + locale(nameAndAction.localeName);
            if (selectedActionName === actionName) {
                _placeAgenda(agendaCard, nameAndAction.placeTop);
                break;
            }
        }
    });
}

function removeRightClickOptions(agendaCard) {
    for (const nameAndAction of NAMES_AND_ACTIONS) {
        const actionName = "*" + locale(nameAndAction.localeName);
        agendaCard.removeCustomAction(actionName);
    }
}

globalEvents.TI4.onSingletonCardCreated.add((card) => {
    assert(card instanceof Card);
    const nsid = ObjectNamespace.getNsid(card);
    if (nsid.startsWith("card.agenda")) {
        addRightClickOptions(card);
        card.__hasRightClickAgendaOptions = true;
    }
});
globalEvents.TI4.onSingletonCardMadeDeck.add((card) => {
    assert(card instanceof Card);
    if (card.__hasRightClickAgendaOptions) {
        removeRightClickOptions(card);
        card.__hasRightClickAgendaOptions = false;
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
