const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { Broadcast } = require("../../lib/broadcast");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { Card, GameObject, world } = require("../../wrapper/api");
const { AbstractRightClickCard } = require("./abstract-right-click-card");

const PURGE_ACTION_NAME = "*" + locale("ui.menu.purge");

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

const PURGE_CONTAINER_NAME = "bag.purge";
let _purgeContainer = false;

/**
 * Creates a contianer to hold purged objects, if one doesn't already exist,
 * otherwise returns the previous container.
 *
 * @returns { Container }
 */
function getPurgeContainer() {
    if (_purgeContainer && _purgeContainer.isValid()) {
        return _purgeContainer;
    }
    for (const obj of world.getAllObjects()) {
        if (obj.getName() === locale(PURGE_CONTAINER_NAME)) {
            _purgeContainer = obj;
            return _purgeContainer;
        }
    }
    throw new Error("missing purge box");
}

/**
 * Moves card to the purged object container and broadcasts a message
 * to report that the card was purged.
 *
 * @param {Card} card
 */
function purge(card) {
    assert(card instanceof Card);
    const objectName = card.getCardDetails().name;
    Broadcast.broadcastAll(locale("ui.message.purge", { objectName }));
    const purgeContainer = getPurgeContainer();
    purgeContainer.addObjects([card], true);
}

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

class RightClickPurge extends AbstractRightClickCard {
    constructor() {
        super();
    }

    isRightClickable(card) {
        return canBePurged(card);
    }

    getRightClickActionNamesAndTooltips(card) {
        return [{ actionName: PURGE_ACTION_NAME, tooltip: undefined }];
    }

    onRightClick(card, player, selectedActionName) {
        if (selectedActionName === PURGE_ACTION_NAME) {
            purge(card);
        }
    }
}

new RightClickPurge();
