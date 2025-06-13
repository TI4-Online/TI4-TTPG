const assert = require("../../wrapper/assert-wrapper");
const { ObjectNamespace } = require("../../lib/object-namespace");
const {
    Card,
    ObjectType,
    Player,
    Rotator,
    world,
} = require("../../wrapper/api");
const { AbstractRightClickCard } = require("./abstract-right-click-card");
const { Broadcast } = require("../../lib/broadcast");
const { Spawn } = require("../../setup/spawn/spawn");
const PositionToPlanet = require("../../lib/system/position-to-planet");
const { CardUtil } = require("../../lib/card/card-util");

/**
 * ACTION: ... roll 1 die, on a result of 1-4 draw a random unused red tile,
 * on a result of 5-10 draw a random unused blue tile; place that tile
 * adjacent to any border system that contains your ships.  Place a frontier
 * token in the newly placed system if it does not contain any planets.
 */
class RightClickAgeOfExploration extends AbstractRightClickCard {
    static getActiveSystemTileNumbers() {
        const activeSystemTileNumbers = new Set();
        for (const obj of world.TI4.getAllSystemTileObjects()) {
            const system = world.TI4.getSystemBySystemTileObject(obj);
            if (system) {
                activeSystemTileNumbers.add(system.tile);
            }
        }
        return activeSystemTileNumbers;
    }

    static getUnusedSystemTileNumber(redOrBlue) {
        const activeSystemTileNumbers =
            RightClickAgeOfExploration.getActiveSystemTileNumbers();

        const unusedSystemTileNumbers = [];
        for (const system of world.TI4.getAllSystems()) {
            if (activeSystemTileNumbers.has(system.tile)) {
                continue;
            }
            if (redOrBlue === "red" && !system.red) {
                continue;
            }
            if (redOrBlue === "blue" && !system.blue) {
                continue;
            }
            if (
                system.raw.offMap ||
                system.home ||
                system.hyperlane ||
                system.tile <= 0
            ) {
                continue;
            }
            if (system.tile === 81) {
                continue; // Muaat hero supernova
            }
            unusedSystemTileNumbers.push(system.tile);
        }

        const index = Math.floor(
            Math.random() * unusedSystemTileNumbers.length
        );
        return unusedSystemTileNumbers[index];
    }

    constructor() {
        super();
    }

    _spawnTile(gameObject, player) {
        const roll = Math.floor(Math.random() * 10) + 1;
        const redOrBlue = roll <= 4 ? "red" : "blue";
        const tileNumber =
            RightClickAgeOfExploration.getUnusedSystemTileNumber(redOrBlue);
        const system = world.TI4.getSystemByTileNumber(tileNumber);
        const summary = system.getSummaryStr();

        const name = world.TI4.getNameByPlayerSlot(player.getSlot());
        Broadcast.chatAll(
            `AGE OF EXPLORATION: ${name} rolled ${roll} to drew a ${redOrBlue} tile`
        );
        Broadcast.chatAll(`${name} drew tile ${tileNumber}: ${summary}`);

        const systemPos = gameObject.getPosition().add([0, 0, 10]);
        const rot = new Rotator(0, 0, 0);

        // Spawn tile.
        const nsid = `tile.system:${system.raw.source}/${tileNumber}`;
        let systemTileObj = undefined;
        for (const obj of world.getAllObjects()) {
            if (ObjectNamespace.getNsid(obj) === nsid) {
                systemTileObj = obj;
                break;
            }
        }
        if (!systemTileObj) {
            systemTileObj = Spawn.spawn(nsid, systemPos, rot);
        }
        systemTileObj.setObjectType(ObjectType.Regular);
        const container = systemTileObj.getContainer();
        if (container) {
            // Remove from container before moving to final location.
            // Bug report said it fell through the table after take.
            container.take(systemTileObj, systemPos, false);
        }

        // Spawn planet cards.
        let offset = 0;
        for (const planet of system.planets) {
            const planetPos = PositionToPlanet.getWorldPosition(
                systemTileObj,
                planet.position
            );

            const planetCardNsid = planet.getPlanetCardNsid();
            const cards = CardUtil.gatherCards((nsid, cardOrDeck) => {
                return nsid === planetCardNsid;
            });
            if (cards && cards.length > 0) {
                const card = cards[0];
                card.setPosition(planetPos.add([0, 0, 3 + offset]));
                card.setRotation([0, 0, 0]);
                offset += 0.1;
            }
        }

        // Spawn frontier token.
        if (system.planets.length === 0) {
            const tokenNsid = "token:pok/frontier";
            const rot = new Rotator(0, 0, 0);
            Spawn.spawn(tokenNsid, systemPos.add([0, 0, 3]), rot);
        }
    }

    isRightClickable(card) {
        assert(card instanceof Card);
        const parsedCard = ObjectNamespace.parseCard(card);
        const name = parsedCard?.name;
        return name && name.startsWith("age_of_exploration");
    }

    getRightClickActionNamesAndTooltips(card) {
        const actionName = "*Draw system";
        const tooltip = undefined;
        return [{ actionName, tooltip }];
    }

    onRightClick(card, player, selectedActionName) {
        assert(card instanceof Card);
        assert(player instanceof Player);
        assert(typeof selectedActionName === "string");

        const actionName = "*Draw system";
        if (selectedActionName === actionName) {
            this._spawnTile(card, player);
        }
    }
}

// Create and register self
new RightClickAgeOfExploration();
