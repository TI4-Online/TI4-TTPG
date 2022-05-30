const assert = require("../../../wrapper/assert-wrapper");
const locale = require("../../../lib/locale");
const { Broadcast } = require("../../../lib/broadcast");
const { Hex } = require("../../../lib/hex");
const { ObjectNamespace } = require("../../../lib/object-namespace");
const {
    AdjacencyHyperlane,
} = require("../../../lib/system/adjacency-hyperlane");
const { AdjacencyNeighbor } = require("../../../lib/system/adjacency-neighbor");
const { AdjacencyWormhole } = require("../../../lib/system/adjacency-wormhole");
const {
    Card,
    GameObject,
    world,
    Vector,
    globalEvents,
} = require("../../../wrapper/api");
const { UnitPlastic } = require("../../../lib/unit/unit-plastic");
const { SimpleDieBuilder } = require("../../../lib/dice/simple-die");
const { FancyRollGroup } = require("../../../lib/dice/roll-group");
const {
    AutoGravRiftRoller,
} = require("../../../global/right-click/grav-rift-roller");

const CARD_NAME = "it_feeds_on_carrion";
const ACTION_NAME = "*" + locale("ui.menu.dimensional_anchor");
const PURGE_CONTAINER_NAME = "bag.purge";
const DELETE_DIE_AFTER_N_SECONDS = 30;
const DIMENSIONAL_TEAR_MISS = 4;
const SHIPS = [
    "carrier",
    "cruiser",
    "destroyer",
    "dreadnought",
    "flagship",
    "war_sun",
];

/**
 * Roll a die for all non-fighter ships in or adjacent to systems that contain
 * a dimensional tear; on a 1-3 capture the unit.
 */
function dimensionalAnchor(card, player) {
    assert(card instanceof Card);
    const cardName = ObjectNamespace.parseCard(card).name;
    assert(cardName === CARD_NAME);

    let cardOwnerSlot = -1;
    for (const desk of world.TI4.getAllPlayerDesks()) {
        const faction = world.TI4.getFactionByPlayerSlot(desk.playerSlot);
        if (faction && faction.raw.leaders.heroes.includes(CARD_NAME)) {
            cardOwnerSlot = desk.playerSlot;
            break;
        }
    }

    if (cardOwnerSlot === -1) {
        Broadcast.broadcastAll(
            locale("ui.message.dimensional_anchor_has_no_owner")
        );
        return;
    }

    const playerName = world.TI4.getNameByPlayerSlot(cardOwnerSlot);

    Broadcast.broadcastAll(
        locale("ui.message.dimensional_anchor", { playerName })
    );

    // Get all hexes with a system tile (much cheaper than getSystemTileObjectByPosition).
    const hexSet = new Set();
    for (const systemTileObj of world.TI4.getAllSystemTileObjects()) {
        const pos = systemTileObj.getPosition();
        const hex = Hex.fromPosition(pos);
        hexSet.add(hex);
    }

    // get all systems with dimensional tears
    const dimensionalTearHexes = new Set();
    for (const obj of world.getAllObjects()) {
        assert(obj instanceof GameObject);

        const name = ObjectNamespace.parseGeneric(obj);

        if (name && name.name === "dimensional_tear") {
            const pos = obj.getPosition();
            const hex = Hex.fromPosition(pos);
            if (!hexSet.has(hex)) {
                continue; // not on a system tile
            }
            dimensionalTearHexes.add(hex);
        }
    }

    // get all systems adjacent to dimensional tears
    const allHexes = new Set();
    for (const hex of dimensionalTearHexes) {
        allHexes.add(hex); // dimensional anchor applies to ships *in* or adjacent to

        const adjNeighbor = new AdjacencyNeighbor(hex);
        for (const adjHex of adjNeighbor.getAdjacent()) {
            allHexes.add(adjHex);
        }

        const adjWormhole = new AdjacencyWormhole(hex, player.getSlot());
        for (const adjHex of adjWormhole.getAdjacent()) {
            allHexes.add(adjHex);
        }

        const adjHyperlane = new AdjacencyHyperlane(hex);
        for (const adjHex of adjHyperlane.getAdjacent()) {
            allHexes.add(adjHex);
        }
    }

    // Remove any hexes that do not contain a system tile.
    const trueHexes = new Set();
    allHexes.forEach((hex) => {
        if (hexSet.has(hex)) {
            trueHexes.add(hex);
        }
    });

    // get all non-fighter ships in those systems not owned by the player
    // whose hero this is
    const plastic = UnitPlastic.getAll().filter((plastic) =>
        trueHexes.has(plastic.hex)
    );

    const ships = plastic.filter((plastic) => {
        return (
            SHIPS.includes(plastic.unit) &&
            plastic.owningPlayerSlot !== cardOwnerSlot
        );
    });

    // roll grav rift for each ship
    const diceObjects = [];
    ships.forEach((unit) => {
        const yaw = Math.random() * 360;
        const d = new Vector(5, 0, 10).rotateAngleAxis(yaw, [0, 0, 1]);
        const pos = player.getCursorPosition().add(d);
        const die = new SimpleDieBuilder()
            .setDeleteAfterSeconds(DELETE_DIE_AFTER_N_SECONDS)
            .setHitValue(DIMENSIONAL_TEAR_MISS)
            .setSpawnPosition(pos)
            .build(player);
        diceObjects.push([die, unit, 0]);
    });

    FancyRollGroup.roll(diceObjects, (diceObjects) => {
        dimensionalAnchorRollFinished(diceObjects, player);
    });

    // purge the card
    let purgeContainer = null;
    for (const obj of world.getAllObjects()) {
        if (obj.getName() === locale(PURGE_CONTAINER_NAME)) {
            purgeContainer = obj;
            break;
        }
    }

    if (purgeContainer) {
        Broadcast.broadcastAll(
            locale("ui.message.purge", { objectName: locale(cardName) })
        );
        purgeContainer.addObjects([card], true);
    }
}

function dimensionalAnchorRollFinished(diceObjects, player) {
    const playerSlot = player.getSlot();
    const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
    const deskName = playerDesk ? playerDesk.colorName : player.getName();
    const faction = world.TI4.getFactionByPlayerSlot(playerSlot);
    const playerName = faction ? faction.nameFull : deskName;
    const color = playerDesk ? playerDesk.color : player.getPlayerColor();

    const parts = [];
    for (const [die, unit, index] of diceObjects) {
        assert(typeof index === "number");
        AutoGravRiftRoller.addLines(die, unit);
        if (!die.isHit()) {
            parts.push(
                locale("ui.message.roll.dimensional_anchor_capture", {
                    value: die.getValue(),
                    unit: locale("unit." + unit.unit),
                })
            );
        } else {
            parts.push(
                locale("ui.message.roll.dimensional_anchor_miss", {
                    value: die.getValue(),
                    unit: locale("unit." + unit.unit),
                })
            );
        }
    }
    const prefix = locale("ui.message.roll.dimensional_anchor", {
        playerName,
    });
    const msg = prefix + parts.join("\n");
    Broadcast.broadcastAll(msg, color);
}

function maybeDimensionalAnchor(card, player, selectedActionName) {
    if (selectedActionName === ACTION_NAME) {
        dimensionalAnchor(card, player);
    }
}

function addRightClickOption(card) {
    assert(card instanceof Card);
    removeRightClickOption(card);
    card.addCustomAction(ACTION_NAME);
    card.onCustomAction.add(maybeDimensionalAnchor);
}

function removeRightClickOption(card) {
    card.removeCustomAction(ACTION_NAME);
    card.onCustomAction.remove(maybeDimensionalAnchor);
}

function isItFeedsOnCarrion(obj) {
    assert(obj instanceof GameObject);

    if (!(obj instanceof Card)) {
        return false;
    }

    if (!ObjectNamespace.isCard(obj)) {
        return false;
    }

    const parsedCard = ObjectNamespace.parseCard(obj);
    if (parsedCard.name === CARD_NAME) {
        return true;
    }
}

globalEvents.TI4.onSingletonCardCreated.add((obj) => {
    if (isItFeedsOnCarrion(obj)) {
        addRightClickOption(obj);
        obj.__hasRightClickDimensionalAnchor = true;
    }
});

globalEvents.TI4.onSingletonCardMadeDeck.add((obj) => {
    if (obj.__hasRightClickDimensionalAnchor) {
        removeRightClickOption(obj);
        delete obj.__hasRightClickDimensionalAnchor;
    }
});

for (const obj of world.getAllObjects()) {
    if (isItFeedsOnCarrion(obj)) {
        addRightClickOption(obj);
        obj.__hasRightClickDimensionalAnchor = true;
    }
}
