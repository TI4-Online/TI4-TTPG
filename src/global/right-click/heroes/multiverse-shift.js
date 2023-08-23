const assert = require("../../../wrapper/assert-wrapper");
const locale = require("../../../lib/locale");
const { AbstractRightClickCard } = require("../abstract-right-click-card");
const { Broadcast } = require("../../../lib/broadcast");
const { Hex } = require("../../../lib/hex");
const { ObjectNamespace } = require("../../../lib/object-namespace");
const { UnitPlastic } = require("../../../lib/unit/unit-plastic");
const { Spawn } = require("../../../setup/spawn/spawn");
const { UnitAttrsSet } = require("../../../lib/unit/unit-attrs-set");
const { Card, world, Rotator } = require("../../../wrapper/api");

const CARD_NAME = "conservator_procyon";
const PURGE_CONTAINER_NAME = "bag.purge";
const ACTION_NAME = "*" + locale("ui.menu.multiverse_shift");
const FRONTIER_TOKEN_NSID = "token:pok/frontier";

function multiverseShift(card) {
    assert(card instanceof Card);
    const cardName = ObjectNamespace.parseCard(card).name;
    assert(cardName === CARD_NAME);

    let cardOwnerSlot = -1;
    let ownerColor;
    for (const desk of world.TI4.getAllPlayerDesks()) {
        const faction = world.TI4.getFactionByPlayerSlot(desk.playerSlot);
        if (faction && faction.raw.leaders.heroes.includes(CARD_NAME)) {
            cardOwnerSlot = desk.playerSlot;
            ownerColor = desk.widgetColor;
            break;
        }
    }

    if (cardOwnerSlot === -1) {
        Broadcast.broadcastAll(
            locale("ui.message.multiverse_shift_has_no_owner")
        );
        return;
    }

    // determine which hexes already have frontier tokens in them
    const frontierTokenHexes = new Set();
    const hexToExistingFrontierTokens = {};
    for (const obj of world.getAllObjects()) {
        if (obj.getContainer()) {
            continue;
        }
        const nsid = ObjectNamespace.getNsid(obj);
        if (nsid !== FRONTIER_TOKEN_NSID) {
            continue;
        }
        const pos = obj.getPosition();
        const hex = Hex.fromPosition(pos);
        frontierTokenHexes.add(hex);
        hexToExistingFrontierTokens[hex] = obj;
    }

    // add frontier tokens to all empty systems that don't already have one
    const exploreSystemTiles = [];
    for (const obj of world.TI4.getAllSystemTileObjects()) {
        if (obj.getContainer()) {
            continue;
        }
        const system = world.TI4.getSystemBySystemTileObject(obj);
        if (system.planets.length > 0 || system.hyperlane) {
            continue;
        }

        const hex = Hex.fromPosition(obj.getPosition());

        let frontierTokenObj = undefined;
        if (!frontierTokenHexes.has(hex)) {
            // drop new frontier token here
            const dy = -2.5 * Hex.SCALE;
            const tokenPos = obj.getPosition().add([0, dy, 1]);
            frontierTokenObj = Spawn.spawn(
                FRONTIER_TOKEN_NSID,
                tokenPos,
                new Rotator(0, 0, 0)
            );
        } else {
            frontierTokenObj = hexToExistingFrontierTokens[hex];
        }

        const unitAttrsSet = new UnitAttrsSet();
        const ownersShipsInHex = UnitPlastic.getAll().filter((plastic) => {
            const isInHex = plastic.hex == hex;
            const isShip = unitAttrsSet.get(plastic.unit).raw.ship;
            const isOwnedByCardOwner =
                plastic.owningPlayerSlot === cardOwnerSlot;
            return isInHex && isShip && isOwnedByCardOwner;
        });

        if (ownersShipsInHex.length > 0) {
            exploreSystemTiles.push(system.tile);

            const pos = frontierTokenObj.getPosition().add([0, 0, 1]);
            const color = ownerColor;
            const playSound = false;
            const ping = () => {
                world.showPing(pos, color, playSound);
            };
            ping();

            // Repeat until explored.
            const pingHandle = setInterval(ping, 2500);
            frontierTokenObj.onDestroyed.add((obj) => {
                clearInterval(pingHandle);
            });
        }
    }

    const playerName = world.TI4.getNameByPlayerSlot(cardOwnerSlot);
    const tiles = exploreSystemTiles.join(", ");
    Broadcast.broadcastAll(
        locale("ui.message.multiverse_shift", { playerName, tiles })
    );

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

class RightClickMultiverseShift extends AbstractRightClickCard {
    constructor() {
        super();
    }
    isRightClickable(card) {
        const parsedCard = ObjectNamespace.parseCard(card);
        return parsedCard && parsedCard.name === CARD_NAME;
    }

    getRightClickActionNamesAndTooltips(card) {
        return [{ actionName: ACTION_NAME, tooltip: undefined }];
    }

    onRightClick(card, player, selectedActionName) {
        if (selectedActionName === ACTION_NAME) {
            multiverseShift(card);
        }
    }
}

new RightClickMultiverseShift();
