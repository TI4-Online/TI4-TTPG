const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { AbstractRightClickCard } = require("./abstract-right-click-card");
const { DealDiscard } = require("../../lib/card/deal-discard");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { Card, Player, globalEvents } = require("../../wrapper/api");

function updateDescription(deck, onTop) {
    if (!deck) {
        deck = DealDiscard.getDeckWithReshuffle("card.agenda");
    }
    if (!deck) {
        return;
    }

    // Descriptions are hidden for face-down decks, but the
    // name is visible.  Edit the name.

    let name = locale("tile.strategy.politics");
    if (onTop === undefined) {
        name = locale("tile.strategy.politics");
    } else {
        name = deck.getName();
        const localeStr = onTop
            ? "ui.menu.place_agenda_top"
            : "ui.menu.place_agenda_bottom";
        const str = locale(localeStr);
        name = name + "\n" + str;
    }
    deck.setName(name);
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

class RightClickAgenda extends AbstractRightClickCard {
    constructor() {
        super();
    }

    init() {}

    isRightClickable(card) {
        assert(card instanceof Card);
        const nsid = ObjectNamespace.getNsid(card);
        return nsid.startsWith("card.agenda");
    }

    getRightClickActionNamesAndTooltips(card) {
        assert(card instanceof Card);
        return NAMES_AND_ACTIONS.map((x) => {
            return {
                actionName: "*" + locale(x.localeName),
                tooltip: undefined,
            };
        });
    }

    onRightClick(card, player, selectedActionName) {
        assert(card instanceof Card);
        assert(player instanceof Player);
        assert(typeof selectedActionName === "string");

        for (const nameAndAction of NAMES_AND_ACTIONS) {
            const actionName = "*" + locale(nameAndAction.localeName);
            if (selectedActionName === actionName) {
                _placeAgenda(card, nameAndAction.placeTop);
                break;
            }
        }
    }
}

// Create and register self
new RightClickAgenda();

globalEvents.TI4.onStrategyCardPlayed.add((strategyCardObj, player) => {
    const parsed = ObjectNamespace.parseGeneric(strategyCardObj);
    if (parsed && parsed.name.startsWith("politics")) {
        updateDescription(undefined, undefined);
    }
});
