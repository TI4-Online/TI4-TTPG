const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { ObjectNamespace } = require("../../lib/object-namespace");
const {
    Card,
    GameObject,
    Vector,
    globalEvents,
    world,
} = require("../../wrapper/api");
const { Broadcast } = require("../../lib/broadcast");

// create a container to hold the purged objects
const PURGE_CONTAINER_TEMPLATE_ID = "A44BAA604E0ED034CD67FA9502214AA7";
const PURGE_CONTAINER_POS = new Vector(32, 113.3, 18);
const PURGE_CONTAINER_NAME = "bag.purge";

/**
 * Creates a contianer to hold purged objects, if one doesn't already exist,
 * otherwise returns the previous container.
 *
 * @returns { Container }
 */
function getPurgeContainer() {
    for (const obj of world.getAllObjects()) {
        if (obj.getName() === locale(PURGE_CONTAINER_NAME)) {
            return obj;
        }
    }
    const container = world.createObjectFromTemplate(
        PURGE_CONTAINER_TEMPLATE_ID,
        PURGE_CONTAINER_POS
    );
    container.setName(locale(PURGE_CONTAINER_NAME));
    return container;
}

const PURGE_CONTAINER = getPurgeContainer();

/**
 * Moves card to the purged object container and broadcasts a message
 * to report that the card was purged.
 *
 * @param {Card} card
 */
function purge(card) {
    assert(card instanceof Card);
    const objectName = ObjectNamespace.parseGeneric(card).name;
    Broadcast.broadcastAll(
        locale("ui.message.purge", { objectName: locale(objectName) })
    );
    PURGE_CONTAINER.addObjects([card], true);
}

/**
 * Adds the right click option to purge a card.
 *
 * @param {Card} card
 */
function addRightClickOption(card) {
    assert(card instanceof Card);
    const actionName = "*" + locale("ui.menu.purge");
    card.addCustomAction(actionName);
    card.onCustomAction.add((card, _player, actionName) => {
        if (actionName === actionName) {
            purge(card);
        }
    });
}

function removeRightClickOption(card) {
    const actionName = "*" + locale("ui.menu.purge");
    card.removeCustomAction(actionName);
}

const PURGABLE_ATTACHMENTS = [
    "research_facility",
    "dmz",
    "rich_world",
    "paradise_world",
    "tomb_of_emphidia",
    "mining_world",
    "lazax_survivors",
    "dyson_sphere",
];

const PURGABLE_EXPLORES = [
    "gamma",
    "mirage",
    "enigmatic_device",
    "relic_fragment",
];

const PURGABLE_RELICS = [
    "dominus_orb",
    "maw_of_worlds",
    "stellar_converter",
    "the_codex",
    "the_crown_of_emphidia",
    "dynamis_core",
    "nano_forge",
];

/**
 * Returns true if the obj can be purged, returns false otherwise.
 *
 * @param {GameObject} obj
 * @returns
 */
function canBePurged(obj) {
    assert(obj instanceof GameObject);

    if (!(obj instanceof Card)) {
        return false;
    }

    if (!ObjectNamespace.isCard(obj)) {
        return false;
    }

    const parsedCard = ObjectNamespace.parseCard(obj);
    const deck = parsedCard.deck;
    const name = parsedCard.name;

    if (deck.startsWith("leader.hero")) {
        return true;
    }

    if (deck.startsWith("exploration")) {
        for (const explore of PURGABLE_EXPLORES) {
            if (name.includes(explore)) {
                return true;
            }
        }

        // rules dont explicitly say to purge these, but the attachment scripts
        // attach an icon to the planet card so theres no need to keep them around
        for (const attachment of PURGABLE_ATTACHMENTS) {
            if (name.includes(attachment)) {
                return true;
            }
        }
    }

    if (deck.startsWith("relic")) {
        for (const relic of PURGABLE_RELICS) {
            if (name.includes(relic)) {
                return true;
            }
        }
    }
}

globalEvents.TI4.onSingletonCardCreated.add((obj) => {
    if (canBePurged(obj)) {
        addRightClickOption(obj);
        obj.__hasRightClickPurge = true;
    }
});

globalEvents.TI4.onSingletonCardMadeDeck.add((obj) => {
    if (obj.__hasRightClickPurge) {
        removeRightClickOption(obj);
        delete obj.__hasRightClickPurge;
    }
});

if (world.getExecutionReason() === "ScriptReload") {
    for (const obj of world.getAllObjects()) {
        if (canBePurged(obj)) {
            addRightClickOption(obj);
            obj.__hasRightClickPurge = true;
        }
    }
}
