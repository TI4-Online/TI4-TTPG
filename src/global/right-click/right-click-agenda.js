const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { DealDiscard } = require("../../lib/card/deal-discard");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { Card, globalEvents, world } = require("../../wrapper/api");

function updateDescription(deck, onTop) {
    if (!deck) {
        deck = DealDiscard.getDeckWithReshuffle("card.agenda");
    }
    if (!deck) {
        return;
    }

    let desc;
    if (onTop === undefined) {
        desc = locale("tile.strategy.politics");
    } else {
        desc = deck.getDescription();
        const localeStr = onTop
            ? "ui.menu.place_agenda_top"
            : "ui.menu.place_agenda_bottom";
        const str = locale(localeStr);
        desc = desc + "\n" + str;
    }
    deck.setDescription(desc);
}

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

    // Add to deck description.
    updateDescription(deck, onTop);
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

function onCustomActionHandler(obj, player, selectedActionName) {
    for (const nameAndAction of NAMES_AND_ACTIONS) {
        const actionName = "*" + locale(nameAndAction.localeName);
        if (selectedActionName === actionName) {
            _placeAgenda(obj, nameAndAction.placeTop);
            break;
        }
    }
}

function addRightClickOptions(agendaCard) {
    assert(agendaCard instanceof Card);

    // Add as right-click options.
    for (const nameAndAction of NAMES_AND_ACTIONS) {
        const actionName = "*" + locale(nameAndAction.localeName);
        agendaCard.addCustomAction(actionName);
    }
    agendaCard.onCustomAction.remove(onCustomActionHandler);
    agendaCard.onCustomAction.add(onCustomActionHandler);
    agendaCard.__hasRightClickAgendaOptions = true;
}

function removeRightClickOptions(agendaCard) {
    for (const nameAndAction of NAMES_AND_ACTIONS) {
        const actionName = "*" + locale(nameAndAction.localeName);
        agendaCard.removeCustomAction(actionName);
        agendaCard.onCustomAction.remove(onCustomActionHandler);
    }
    agendaCard.__hasRightClickAgendaOptions = false;
}

globalEvents.TI4.onSingletonCardCreated.add((card) => {
    assert(card instanceof Card);
    const nsid = ObjectNamespace.getNsid(card);
    if (nsid.startsWith("card.agenda")) {
        addRightClickOptions(card);
    }
});

globalEvents.TI4.onSingletonCardMadeDeck.add((card) => {
    assert(card instanceof Card);
    if (card.__hasRightClickAgendaOptions) {
        removeRightClickOptions(card);
    }
});

globalEvents.TI4.onStrategyCardPlayed.add((strategyCardObj, player) => {
    const parsed = ObjectNamespace.parseGeneric(strategyCardObj);
    if (parsed && parsed.name.startsWith("politics")) {
        updateDescription(undefined, undefined);
    }
});

for (const obj of world.getAllObjects()) {
    const nsid = ObjectNamespace.getNsid(obj);
    if (nsid.startsWith("card.agenda")) {
        addRightClickOptions(obj);
    }
}
