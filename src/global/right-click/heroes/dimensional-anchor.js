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
const { Card, GameObject, world, Vector } = require("../../../wrapper/api");
const { UnitPlastic } = require("../../../lib/unit/unit-plastic");
const { SimpleDieBuilder } = require("../../../lib/dice/simple-die");
const { RollGroup } = require("../../../lib/dice/roll-group");
const {
    AutoGravRiftRoller,
} = require("../../../global/right-click/grav-rift-roller");
const { UnitAttrsSet } = require("../../../lib/unit/unit-attrs-set");
const { AbstractRightClickCard } = require("../abstract-right-click-card");

const CARD_NSID_NAME = "it_feeds_on_carrion";
const ACTION_NAME = "*" + locale("ui.menu.dimensional_anchor");
const PURGE_CONTAINER_NAME = "bag.purge";
const DELETE_DIE_AFTER_N_SECONDS = 10;
const DIMENSIONAL_TEAR_MISS = 4;

/**
 * Roll a die for all non-fighter ships in and adjacent to systems that contain
 * a dimensional tear; on a 1-3 capture the unit.
 *
 * Do not roll for ships *in* systems, if a player is blockading
 * none of their ships roll.
 *
 * Ugh, except if Nekro copies, the nekro versions do not count as blockade.
 */
function dimensionalAnchor(card, player) {
    assert(card instanceof Card);
    const cardNsidName = ObjectNamespace.parseCard(card).name;
    assert(cardNsidName === CARD_NSID_NAME);

    let cardOwnerSlot = -1;
    for (const desk of world.TI4.getAllPlayerDesks()) {
        const faction = world.TI4.getFactionByPlayerSlot(desk.playerSlot);
        if (faction && faction.raw.leaders.heroes.includes(CARD_NSID_NAME)) {
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
    const hexToSystemTile = {};
    for (const systemTileObj of world.TI4.getAllSystemTileObjects()) {
        const pos = systemTileObj.getPosition();
        const hex = Hex.fromPosition(pos);
        hexSet.add(hex);
        hexToSystemTile[hex] =
            world.TI4.getSystemBySystemTileObject(systemTileObj).tile;
    }

    // get all systems with dimensional tears
    const dimensionalTearHexes = new Set();
    const blockadableHexes = new Set();
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

            // Blockade matters for vuilraith token, not for nekro version.
            if (name.type === "token.vuilraith") {
                blockadableHexes.add(hex);
            }
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

    // Get all ships in applicable hexes, including fighters (for blockade check).
    // Only consider ships owned by other players.
    const unitAttrsSet = new UnitAttrsSet();
    const plastic = UnitPlastic.getAll().filter((plastic) => {
        const inHex = trueHexes.has(plastic.hex);
        const isShip = unitAttrsSet.get(plastic.unit).raw.ship;
        const isOwnedByCardOwner = plastic.owningPlayerSlot === cardOwnerSlot;
        return inHex && isShip && !isOwnedByCardOwner;
    });

    // Are any ships blockading?
    const blockadingPlayerSlots = new Set();
    for (const ship of plastic) {
        const playerSlot = ship.owningPlayerSlot;
        if (
            blockadableHexes.has(ship.hex) &&
            !blockadingPlayerSlots.has(playerSlot)
        ) {
            blockadingPlayerSlots.add(playerSlot);
            const blockadingPlayerName =
                world.TI4.getNameByPlayerSlot(playerSlot);
            Broadcast.broadcastAll(
                locale("ui.message.dimensional_anchor_blockaded", {
                    playerName: blockadingPlayerName,
                })
            );
        }
    }

    // Restrict to non-blockading, non-fighter ships.
    const ships = plastic.filter((plastic) => {
        const isBlockading = blockadingPlayerSlots.has(
            plastic.owningPlayerSlot
        );
        const isFighter = plastic.unit === "fighter";
        return !isBlockading && !isFighter;
    });

    // roll grav rift for each ship
    const dice = [];
    ships.forEach((unit) => {
        const yaw = Math.random() * 360;
        const d = new Vector(5, 0, 10).rotateAngleAxis(yaw, [0, 0, 1]);
        const pos = player.getCursorPosition().add(d);
        const systemTile = hexToSystemTile[unit.hex];
        const die = new SimpleDieBuilder()
            .setDeleteAfterSeconds(DELETE_DIE_AFTER_N_SECONDS)
            .setHitValue(DIMENSIONAL_TEAR_MISS)
            .setSpawnPosition(pos)
            .setAuxObject({ unit, systemTile })
            .build(player);
        dice.push(die);
    });

    RollGroup.roll(dice, (dice) => {
        dimensionalAnchorRollFinished(dice, player);
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
        const objectName = card.getCardDetails().name;
        Broadcast.broadcastAll(locale("ui.message.purge", { objectName }));
        purgeContainer.addObjects([card], true);
    }
}

function dimensionalAnchorRollFinished(dice, player) {
    const playerSlot = player.getSlot();
    const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
    const playerName = world.TI4.getNameByPlayerSlot(playerSlot);
    const color = playerDesk ? playerDesk.color : player.getPlayerColor();

    const parts = [];
    // sort dice objects by owner, system tile, then isHit to make the logs easier to parse
    dice.sort((dieA, dieB) => {
        const unitA = dieA.getAuxObject().unit;
        const systemTileA = dieA.getAuxObject().systemTile;
        const unitB = dieB.getAuxObject().unit;
        const systemTileB = dieB.getAuxObject().systemTile;
        if (unitA.owningPlayerSlot == unitB.owningPlayerSlot) {
            if (systemTileA === systemTileB) {
                return dieA.isHit() - dieB.isHit();
            } else {
                return systemTileA - systemTileB;
            }
        } else {
            return unitA.owningPlayerSlot - unitB.owningPlayerSlot;
        }
    });
    for (const die of dice) {
        const unit = die.getAuxObject().unit;
        const systemTile = die.getAuxObject().systemTile;
        // start countdown to remove lines on units that are captured once they are grabbed
        // start countdown for non-captured units right away
        AutoGravRiftRoller.addLines(die, unit, !die.isHit());
        if (!die.isHit()) {
            parts.push(
                locale("ui.message.roll.dimensional_anchor_capture", {
                    value: die.getValue(),
                    unit: locale("unit." + unit.unit),
                    owner: world.TI4.getNameByPlayerSlot(unit.owningPlayerSlot),
                    system: systemTile,
                })
            );
        } else {
            parts.push(
                locale("ui.message.roll.dimensional_anchor_miss", {
                    value: die.getValue(),
                    unit: locale("unit." + unit.unit),
                    owner: world.TI4.getNameByPlayerSlot(unit.owningPlayerSlot),
                    system: systemTile,
                })
            );
        }
    }
    Broadcast.broadcastAll(
        locale("ui.message.roll.dimensional_anchor", {
            playerName,
        })
    );
    Broadcast.chatAll(parts.join("\n"), color);
}

class RightClickDimensionalAnchor extends AbstractRightClickCard {
    constructor() {
        super();
    }

    isRightClickable(card) {
        const parsedCard = ObjectNamespace.parseCard(card);
        return parsedCard && parsedCard.name === CARD_NSID_NAME;
    }

    getRightClickActionNamesAndTooltips(card) {
        return [{ actionName: ACTION_NAME, tooltip: undefined }];
    }

    onRightClick(card, player, selectedActionName) {
        if (selectedActionName === ACTION_NAME) {
            dimensionalAnchor(card, player);
        }
    }
}

new RightClickDimensionalAnchor();
