const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { Card, GameObject, Player, world } = require("../../wrapper/api");
const { AbstractRightClickCard } = require("./abstract-right-click-card");

const ACTION_NAME =
    "*" +
    locale("ui.menu.fetch_planet", {
        planetName: "",
    });

/**
 * Moves card to the planet board.
 *
 * @param {Card} card
 */
function fetch(card, player) {
    assert(card instanceof Card);
    assert(player instanceof Player);

    let mat = undefined;
    for (const obj of world.getAllObjects()) {
        if (obj.getContainer()) {
            continue;
        }
        const nsid = ObjectNamespace.getNsid(obj);
        if (nsid !== "mat:base/planets") {
            continue;
        }
        const pos = obj.getPosition();
        const desk = world.TI4.getClosestPlayerDesk(pos);
        if (desk.playerSlot !== player.getSlot()) {
            continue;
        }
        mat = obj;
        break;
    }
    if (!mat) {
        console.log("RightClickFetchPlanetCard: no mat");
        return;
    }

    const pos = mat.getPosition().add([0, 0, 10]);
    const rot = card.getRotation();
    rot.yaw = mat.getRotation().yaw;
    card.setPosition(pos, 1);
    card.setRotation(rot, 1);
}

/**
 * Returns true if the obj can be fetched, returns false otherwise.
 *
 * @param {GameObject} obj
 * @returns
 */
function canBeFetched(obj) {
    assert(obj instanceof GameObject);

    if (!(obj instanceof Card)) {
        return false;
    }

    if (!ObjectNamespace.isCard(obj)) {
        return false;
    }

    const parsedCard = ObjectNamespace.parseCard(obj);
    if (!parsedCard) {
        return false;
    }

    const deck = parsedCard.deck;
    return (
        deck.startsWith("planet") ||
        deck.startsWith("legendary_planet") ||
        deck.startsWith("exploration")
    );
}

class RightClickFetchPlanet extends AbstractRightClickCard {
    constructor() {
        super();
    }

    isRightClickable(card) {
        return canBeFetched(card);
    }

    getRightClickActionNamesAndTooltips(card) {
        return [{ actionName: ACTION_NAME, tooltip: undefined }];
    }

    onRightClick(card, player, selectedActionName) {
        if (selectedActionName === ACTION_NAME) {
            fetch(card, player);
        }
    }
}

new RightClickFetchPlanet();
