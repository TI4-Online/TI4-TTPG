const assert = require("../../../wrapper/assert-wrapper");
const { Broadcast } = require("../../../lib/broadcast");
const { DealDiscard } = require("../../../lib/card/deal-discard");
const { Hex } = require("../../../lib/hex");
const { Hyperlane } = require("../../../lib/map-string/hyperlane");
const { MapStringLoad } = require("../../../lib/map-string/map-string-load");
const MapStringParser = require("../../../lib/map-string/map-string-parser");
const { MapStringSave } = require("../../../lib/map-string/map-string-save");
const { MapToolUI } = require("./map-tool-ui");
const { ObjectNamespace } = require("../../../lib/object-namespace");
const PositionToPlanet = require("../../../lib/system/position-to-planet");
const { Spawn } = require("../../../setup/spawn/spawn");
const { Card, Rotator, world } = require("../../../wrapper/api");
const locale = require("../../../lib/locale");

class MapTool {
    static getMapTilesContainer() {
        // Look for a container with a system tile in it.
        for (const obj of world.getAllObjects()) {
            if (!ObjectNamespace.isSystemTile(obj)) {
                continue;
            }
            const container = obj.getContainer();
            if (container) {
                return container;
            }
        }
    }

    constructor() {
        // Pass wrapped functions that call with "this" correctly.
        const onButtonCallbacks = {
            clear: () => {
                this.clearFrontierTokens();
                this.clearCards();
                this.clear();
            },
            save: () => {
                this.save();
            },
            load: () => {
                this.load();
            },
            placeCards: () => {
                this.placeCards();
            },
            clearCards: () => {
                this.clearCards();
            },
            placeFrontierTokens: () => {
                this.placeFrontierTokens();
            },
            clearFrontierTokens: () => {
                this.clearFrontierTokens();
            },
            placeHyperlanes: () => {
                this.placeHyperlanes();
            },
        };
        this._ui = new MapToolUI(onButtonCallbacks);
    }

    getUI() {
        return this._ui.getWidget();
    }

    clear() {
        console.log("MapTool.clear");
        const clearedSet = new Set();
        const bag = MapTool.getMapTilesContainer();
        for (const obj of world.TI4.getAllSystemTileObjects()) {
            const system = world.TI4.getSystemBySystemTileObject(obj);
            if (system.home) {
                continue;
            }
            if (!bag || clearedSet.has(system.tile)) {
                obj.setTags(["DELETED_ITEMS_IGNORE"]);
                obj.destroy();
            } else {
                clearedSet.add(system.tile);
                bag.addObjects([obj]);
            }
        }
    }

    save() {
        const mapString = MapStringSave.save();
        console.log(`MapTool.save: "${mapString}"`);
        Broadcast.chatAll(mapString);
        this._ui.setMapString(mapString);
    }

    load() {
        const mapString = this._ui.getMapString().trim();
        console.log(`MapTool.load: "${mapString}"`);

        if (mapString.length === 0 || !MapStringParser.validate(mapString)) {
            const msg = locale("ui.error.invalid_map_string", { mapString });
            Broadcast.chatAll(msg, Broadcast.ERROR);
            return;
        }

        MapStringLoad.moveGenericHomeSystemTiles(mapString);
        MapStringLoad.load(mapString);
    }

    placeCards() {
        console.log("MapTool.placeCards");

        // Build wanted cards.
        const nsidTypeAndNameToPos = {};
        for (const obj of world.TI4.getAllSystemTileObjects()) {
            const system = world.TI4.getSystemBySystemTileObject(obj);
            // Ignore home systems.
            if (system.home) {
                continue;
            }
            for (const planet of system.planets) {
                const planetNsidName = planet.getPlanetNsidName();

                let key = `card.planet/${planetNsidName}`;
                const pos = PositionToPlanet.getWorldPosition(
                    obj,
                    planet.position
                );
                nsidTypeAndNameToPos[key] = pos.add([0, 0, 4]);

                if (planet.raw.legendary) {
                    const nsid = planet.raw.legendaryCard;
                    const parsed = ObjectNamespace.parseNsid(nsid);
                    assert(parsed.type === "card.legendary_planet");
                    key = `${parsed.type}/${parsed.name}`;
                    nsidTypeAndNameToPos[key] = pos.add([0, 0, 3]);
                }
            }
        }

        const nsidToPos = (nsid) => {
            const parsed = ObjectNamespace.parseNsid(nsid);
            if (!parsed) {
                return false;
            }
            const key = `${parsed.type}/${parsed.name}`;
            return nsidTypeAndNameToPos[key];
        };

        const rot = new Rotator(0, 0, 0);
        const movePlanetCard = (cardObj, pos) => {
            assert(cardObj instanceof Card);
            cardObj.setPosition(pos, 1);
            cardObj.setRotation(rot);
        };

        // Find cards.
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue; // ignore inside containers
            }
            if (!(obj instanceof Card)) {
                continue;
            }
            if (obj.getStackSize() > 1) {
                // Cards in a deck are not objects, pull them out.
                const nsids = ObjectNamespace.getDeckNsids(obj);
                for (let i = nsids.length - 1; i >= 0; i--) {
                    const pos = nsidToPos(nsids[i]);
                    if (pos) {
                        let cardObj;
                        if (obj.getStackSize() > 1) {
                            cardObj = obj.takeCards(1, true, i);
                        } else {
                            cardObj = obj; // cannot take final card
                        }
                        movePlanetCard(cardObj, pos);
                    }
                }
            } else {
                const nsid = ObjectNamespace.getNsid(obj);
                const pos = nsidToPos(nsid);
                if (pos) {
                    movePlanetCard(obj, pos);
                }
            }
        }

        // Custodians token.
        let mecatolSystemTile = false;
        let custodiansToken = false;
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue; // ignore inside containers
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid === "tile.system:base/18") {
                mecatolSystemTile = obj;
            } else if (nsid === "token:base/custodians") {
                custodiansToken = obj;
            }
        }
        if (mecatolSystemTile && custodiansToken) {
            console.log("MapTool.placeCards: placing custodians token");
            const pos = mecatolSystemTile.getPosition().add([0, 0, 5]);
            custodiansToken.setPosition(pos, 1);
        }
    }

    clearCards() {
        console.log("MapTool.clearCards");

        const loosePlanetCards = [];
        const looseLegendaryPlanetCards = [];
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue; // ignore inside container
            }
            if (!(obj instanceof Card)) {
                continue;
            }
            if (obj.getStackSize() > 1) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid.startsWith("card.planet")) {
                const planet = world.TI4.getPlanetByCard(obj);
                if (planet && planet.system.home) {
                    continue;
                }
                loosePlanetCards.push(obj);
            } else if (nsid.startsWith("card.legendary_planet")) {
                looseLegendaryPlanetCards.push(obj);
            }
        }

        if (loosePlanetCards.length > 0) {
            for (const cardObj of loosePlanetCards) {
                DealDiscard.discard(cardObj);
            }
        }
        if (looseLegendaryPlanetCards.length > 0) {
            for (const cardObj of looseLegendaryPlanetCards) {
                DealDiscard.discard(cardObj);
            }
        }
    }

    placeFrontierTokens() {
        console.log("MapTool.placeFrontierTokens");
        const emptyPositions = [];
        const skipSystems = [
            81, // Muaat hero supernova tile
        ];
        for (const obj of world.TI4.getAllSystemTileObjects()) {
            const system = world.TI4.getSystemBySystemTileObject(obj);
            if (
                system.planets.length === 0 &&
                !system.hyperlane &&
                !skipSystems.includes(system.tile)
            ) {
                const dy = -2.5 * Hex.SCALE;
                emptyPositions.push(obj.getPosition().add([0, dy, 1]));
            }
        }

        const tokenNsid = "token:pok/frontier";
        const rot = new Rotator(0, 0, 0);
        for (const pos of emptyPositions) {
            Spawn.spawn(tokenNsid, pos, rot);
        }
    }

    clearFrontierTokens() {
        console.log("MapTool.clearFrontierTokens");

        const tokenNsid = "token:pok/frontier";
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue;
            }
            if (ObjectNamespace.getNsid(obj) === tokenNsid) {
                obj.destroy();
            }
        }
    }

    placeHyperlanes() {
        const playerCount = world.TI4.config.playerCount;
        console.log(`MapTool.placeHyperlanes for ${playerCount} player count`);

        const mapString = Hyperlane.getMapString(playerCount);
        if (mapString) {
            MapStringLoad.load(mapString);
        }
    }
}

module.exports = { MapTool };
