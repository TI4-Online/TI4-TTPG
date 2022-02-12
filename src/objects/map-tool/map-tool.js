const assert = require("../../wrapper/assert-wrapper");
const { MapStringLoad } = require("../../lib/map-string/map-string-load");
const { MapStringSave } = require("../../lib/map-string/map-string-save");
const { MapToolUI } = require("./map-tool-ui");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { PlayerDesk } = require("../../lib/player-desk");
const { Spawn } = require("../../setup/spawn/spawn");
const { System } = require("../../lib/system/system");
const {
    Card,
    GameObject,
    Rotator,
    refObject,
    world,
} = require("../../wrapper/api");

class MapTool {
    static getMapTilesContainer() {
        // TODO XXX For now just look for a container with a system tile in it.
        for (const obj of world.getAllObjects()) {
            if (!ObjectNamespace.isSystemTile(obj)) {
                continue;
            }
            const container = obj.getContainer();
            if (container) {
                return container;
            }
        }
        throw new Error("MapTool.getMapTilesContainer: no container");
    }

    static getDeck(cardNsidPrefix) {
        // TODO XXX For now just look for a deck with a planet card in it.
        for (const obj of world.getAllObjects()) {
            if (obj.getContainer()) {
                continue; // ignore inside container
            }
            if (!(obj instanceof Card)) {
                continue;
            }
            if (obj.getStackSize() <= 1) {
                continue;
            }
            const nsids = ObjectNamespace.getDeckNsids(obj);
            if (nsids[0].startsWith(cardNsidPrefix)) {
                return obj;
            }
        }
        throw new Error(`MapTool.getDeck: no deck "${cardNsidPrefix}"`);
    }

    constructor(gameObject) {
        assert(gameObject instanceof GameObject);
        this._obj = gameObject;

        // Pass wrapped functions that call with "this" correctly.
        const onButtonMap = {
            clear: () => {
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
        this._ui = new MapToolUI(this._obj, onButtonMap);
    }

    clear() {
        console.log("MapTool.clear");
        const bag = MapTool.getMapTilesContainer();
        for (const obj of System.getAllSystemTileObjects()) {
            const system = System.getBySystemTileObject(obj);
            if (system.raw.offMap) {
                continue; // only clear main-map systems.
            }
            bag.addObjects([obj]);
        }
    }

    save() {
        const mapString = MapStringSave.save();
        console.log(`MapTool.save: "${mapString}"`);
        this._ui.setMapString(mapString);
    }

    load() {
        const mapString = this._ui.getMapString().trim();
        console.log(`MapTool.load: "${mapString}"`);
        if (mapString.length === 0) {
            return;
        }
        MapStringLoad.load(mapString);
    }

    placeCards() {
        console.log("MapTool.placeCards");

        // Build wanted cards.
        const nsidTypeAndNameToPos = {};
        for (const obj of System.getAllSystemTileObjects()) {
            const system = System.getBySystemTileObject(obj);
            let pos = obj.getPosition().subtract([1, 1, 0]);
            for (const planet of system.planets) {
                const planetNsidName = planet.getPlanetNsidName();

                let key = `card.planet/${planetNsidName}`;
                nsidTypeAndNameToPos[key] = pos.add([0, 0, 1]);

                if (planet.raw.legendary) {
                    const nsid = planet.raw.legendaryCard;
                    const parsed = ObjectNamespace.parseNsid(nsid);
                    assert(parsed.type === "card.legendary_planet");
                    key = `${parsed.type}/${parsed.name}`;
                    nsidTypeAndNameToPos[key] = pos;
                }

                pos = pos.add([2, 2, 0]);
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
                loosePlanetCards.push(obj);
            } else if (nsid.startsWith("card.legendary_planet")) {
                looseLegendaryPlanetCards.push(obj);
            }
        }

        const toFront = false;
        const offset = 0;
        const animate = true;
        const flipped = false;
        if (loosePlanetCards.length > 0) {
            const deck = MapTool.getDeck("card.planet");
            for (const cardObj of loosePlanetCards) {
                deck.addCards(cardObj, toFront, offset, animate, flipped);
            }
        }
        if (looseLegendaryPlanetCards.length > 0) {
            const deck = MapTool.getDeck("card.legendary_planet");
            for (const cardObj of looseLegendaryPlanetCards) {
                deck.addCards(cardObj, toFront, offset, animate, flipped);
            }
        }
    }

    placeFrontierTokens() {
        console.log("MapTool.placeFrontierTokens");
        const emptyPositions = [];
        for (const obj of System.getAllSystemTileObjects()) {
            const system = System.getBySystemTileObject(obj);
            if (system.planets.length === 0) {
                emptyPositions.push(obj.getPosition().add([0, 0, 1]));
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
        const playerCount = PlayerDesk.getPlayerCount();
        console.log(`MapTool.placeHyperlanes for ${playerCount} player count`);

        // XXX TODO
    }
}

refObject.onCreated.add((obj) => {
    new MapTool(obj);
});

if (world.getExecutionReason() === "ScriptReload") {
    new MapTool(refObject);
}
