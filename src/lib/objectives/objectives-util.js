const _ = require("lodash");
const assert = require("../../wrapper/assert-wrapper");
const { Adjacency } = require("../system/adjacency");
const { Facing } = require("../facing");
const { Hex } = require("../hex");
const { ObjectNamespace } = require("../object-namespace");
const { UnitAttrs } = require("../unit/unit-attrs");
const { UnitPlastic } = require("../unit/unit-plastic");
const { Card, GameObject, world } = require("../../wrapper/api");

let _strategyCardMat = undefined;

// Temporary caches, keep for one frame (tiles can move).
let _edgeOfGameBoardHexes = undefined;
let _hexToHomeSystemPlayerSlot = undefined;
let _hexToHomeOrHomeAdjPlayerSlots = undefined;
let _legendaryMecatolAnomalyHexes = undefined;
let _mecatolHex = undefined;
let _playerSlotToMecatolAdjacency = undefined;
let _systemHexes = undefined;

// Allow natural sorting by value
const STAGE = {
    ONE: 1,
    TWO: 2,
    SECRET: 8,
    OTHER: 9,
};

class ObjectivesUtil {
    constructor() {
        throw new Error("static only");
    }

    /**
     * Get objective stage.
     *
     * @param {GameObject} obj
     * @returns {number}
     */
    static _getObjectiveStage(obj) {
        assert(obj instanceof GameObject);
        const nsid = ObjectNamespace.getNsid(obj);
        if (nsid.startsWith("card.objective.public_1")) {
            return STAGE.ONE;
        } else if (nsid.startsWith("card.objective.public_2")) {
            return STAGE.TWO;
        } else if (nsid.startsWith("card.objective.secret")) {
            return STAGE.SECRET;
        }
        return STAGE.OTHER;
    }

    /**
     * Is the given object within the strategy card mat XY bounds?
     * Useful for segrating tradegoods on unpicked strategy cards.
     *
     * @param {GameObject} obj
     * @returns {boolean}
     */
    static _isOnStrategyCardMat(obj) {
        assert(obj instanceof GameObject);
        if (!_strategyCardMat || !_strategyCardMat.isValid()) {
            _strategyCardMat = undefined;
            const skipContained = true;
            for (const candidate of world.getAllObjects(skipContained)) {
                const nsid = ObjectNamespace.getNsid(candidate);
                if (nsid === "mat:base/strategy_card") {
                    _strategyCardMat = candidate;
                    break;
                }
            }
        }
        if (!_strategyCardMat) {
            return false;
        }
        const pos = obj.getPosition();
        const matPos = _strategyCardMat.worldPositionToLocal(pos);
        const extent = _strategyCardMat.getExtent();
        return Math.abs(matPos.x) < extent.x && Math.abs(matPos.y) < extent.y;
    }

    static _sortNsids(nsids) {
        return nsids.sort((a, b) => {
            a = ObjectNamespace.parseNsid(a);
            b = ObjectNamespace.parseNsid(b);
            if (a.type !== b.type) {
                return a.type.localeCompare(b.type);
            }
            return a.name.localeCompare(b.name);
        });
    }

    /**
     * Sort (in-place) objective objects.  Sort first by stage (secrets last),
     * the by snap points to preserve game-order.
     *
     * @param {Array.{GameObject}} objs
     * @returns {Array.{GameObject}}
     */
    static _sortObjectives(objs) {
        assert(Array.isArray(objs));
        const sortObjectives = (a, b) => {
            assert(a instanceof GameObject);
            assert(b instanceof GameObject);

            // Stage 1 > Stage 2 > Secret > other.
            const aStage = ObjectivesUtil._getObjectiveStage(a);
            const bStage = ObjectivesUtil._getObjectiveStage(b);
            if (aStage !== bStage) {
                return aStage - bStage;
            }

            // Sort by snap points (game order on objective mat).
            const aSnap = a.getSnappedToPoint();
            const bSnap = b.getSnappedToPoint();
            const aIdx = aSnap ? aSnap.getIndex() : -1;
            const bIdx = bSnap ? bSnap.getIndex() : -1;
            if (aIdx >= 0 && bIdx >= 0) {
                return bIdx - aIdx;
            }

            // Otherwise sort by nsid for determinism (unittests).
            const aNsid = ObjectNamespace.getNsid(a);
            const bNsid = ObjectNamespace.getNsid(b);
            return aNsid.localeCompare(bNsid);
        };
        return objs.sort(sortObjectives);
    }

    /**
     * Get active objectives, and which desk index(es) scored each (if any).
     * Sort objectives in game order.
     *
     * @returns {Array.{Object.{nsid:string,name:string,scoredBy:Array.{number}}}}
     */
    static findPublicObjctivesAndAlreadyScored(includeFaceDown = false) {
        // Get exposed objectives (include secrets not in a holder, one might be made public)
        // and control tokens.
        const controlTokens = [];
        let objectiveCards = [];
        const skipContained = true;
        for (const obj of world.getAllObjects(skipContained)) {
            // Watch out for objects currently being moved.
            if (obj.isHeld()) {
                continue;
            }
            const nsid = ObjectNamespace.getNsid(obj);
            if (nsid.startsWith("token.control")) {
                controlTokens.push(obj);
                continue;
            }

            // At this point looking for face-up objective cards.
            if (!(obj instanceof Card)) {
                continue; // not a card
            }
            if (!nsid.startsWith("card.objective")) {
                continue; // not an objective
            }
            if (!includeFaceDown && !obj.isFaceUp()) {
                continue; // face down
            }
            const cardHolder = obj.getHolder();
            if (cardHolder && cardHolder.getOwningPlayerSlot() !== -1) {
                continue; // in a player's hand
            }
            if (cardHolder) {
                continue; // in player's scoring holder
            }
            objectiveCards.push(obj);
        }
        objectiveCards = ObjectivesUtil._sortObjectives(objectiveCards);

        // Who scored each?
        const result = objectiveCards.map((objectiveCard) => {
            const cardExtent = objectiveCard.getExtent();
            const scoredBy = new Set();
            for (const controlToken of controlTokens) {
                const pos = controlToken.getPosition();
                const cardPos = objectiveCard.worldPositionToLocal(pos);
                if (
                    Math.abs(cardPos.x) > cardExtent.x ||
                    Math.abs(cardPos.y) > cardExtent.y
                ) {
                    continue; // control token not on objective card
                }
                const playerSlot = controlToken.getOwningPlayerSlot();
                if (playerSlot < 0) {
                    continue;
                }
                const playerDesk =
                    world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
                if (!playerDesk) {
                    continue;
                }
                scoredBy.add(playerDesk.index);
            }
            return {
                id: objectiveCard.getId(),
                nsid: ObjectNamespace.getNsid(objectiveCard),
                name: objectiveCard.getCardDetails().name,
                stage: ObjectivesUtil._getObjectiveStage(objectiveCard),
                scoredBy: Array.from(scoredBy),
            };
        });
        return result;
    }

    /**
     * Which player desk index is closest to this object?
     *
     * @param {GameObject} obj
     * @returns {number}
     */
    static getDeskIndexClosest(obj) {
        assert(obj instanceof GameObject);
        const pos = obj.getPosition();
        const playerDesk = world.TI4.getClosestPlayerDesk(pos);
        return playerDesk.index;
    }

    /**
     * Which player desk index owns this object? (-1 if none, [].map skips -1)
     *
     * @param {GameObject} obj
     * @returns {number}
     */
    static getDeskIndexOwning(obj) {
        assert(obj instanceof GameObject);
        const playerSlot = obj.getOwningPlayerSlot();
        const playerDesk = world.TI4.getPlayerDeskByPlayerSlot(playerSlot);
        return playerDesk ? playerDesk.index : -1; // [].map conveniently skips -1 index
    }

    /**
     * Return the hex if the object is in a system adjacent to mecatol
     * (includes wormholes, hyperlanes, etc).  Works with ghosts.
     *
     * @param {GameObject} obj
     * @returns {string | false}
     */
    static getHexIfUnitIsAdjacentToMecatol(obj) {
        assert(obj instanceof GameObject);

        // Calculate once for this frame, then discard cached version.
        // System tiles can move!
        if (!_playerSlotToMecatolAdjacency) {
            let mecatolHex = undefined;
            const skipContained = true;
            for (const candidate of world.getAllObjects(skipContained)) {
                const nsid = ObjectNamespace.getNsid(candidate);
                if (nsid === "tile.system:base/18") {
                    const pos = candidate.getPosition();
                    const hex = Hex.fromPosition(pos);
                    mecatolHex = hex;
                    break;
                }
            }
            if (!mecatolHex) {
                return false;
            }

            // Adjacency can return hexes without tiles.  Restrict to tiles.
            const restrictHexes = new Set();
            for (const systemTileObj of world.TI4.getAllSystemTileObjects()) {
                const pos = systemTileObj.getPosition();
                const hex = Hex.fromPosition(pos);
                restrictHexes.add(hex);
            }

            // Compute adjacent separately (e.g. ghosts a-b wormholes).
            _playerSlotToMecatolAdjacency = {};
            for (const playerDesk of world.TI4.getAllPlayerDesks()) {
                const playerSlot = playerDesk.playerSlot;
                const adjHexes = Adjacency.getAdjacent(
                    mecatolHex,
                    playerSlot
                ).filter((hex) => restrictHexes.has(hex));
                _playerSlotToMecatolAdjacency[playerSlot] = adjHexes;
            }

            // Discard next frame because tiles can move
            // (schedule here so it only happens once).
            if (!world.__isMock) {
                process.nextTick(() => {
                    _playerSlotToMecatolAdjacency = undefined;
                });
            }
        }

        let result = false;
        const playerSlot = obj.getOwningPlayerSlot();
        const adjHexes = _playerSlotToMecatolAdjacency[playerSlot];
        if (adjHexes) {
            const unitHex = Hex.fromPosition(obj.getPosition());
            if (adjHexes.includes(unitHex)) {
                result = unitHex;
            }
        }
        if (world.__isMock) {
            _playerSlotToMecatolAdjacency = undefined;
        }
        return result;
    }

    static getHexIfUnitIsInLegendaryMecatolOrAnomaly(obj) {
        assert(obj instanceof GameObject);

        if (!_legendaryMecatolAnomalyHexes) {
            _legendaryMecatolAnomalyHexes = new Set();

            // Skips contained objects, as well as tile 0 objects.
            for (const systemTileObj of world.TI4.getAllSystemTileObjects()) {
                const system =
                    world.TI4.getSystemBySystemTileObject(systemTileObj);
                if (!system) {
                    continue;
                }
                if (
                    system.legendary ||
                    system.tile === 18 ||
                    system.anomalies.length > 0
                ) {
                    const pos = systemTileObj.getPosition();
                    const hex = Hex.fromPosition(pos);
                    _legendaryMecatolAnomalyHexes.add(hex);
                }
            }

            // Discard next frame because tiles can move
            // (schedule here so it only happens once).
            if (!world.__isMock) {
                process.nextTick(() => {
                    _legendaryMecatolAnomalyHexes = undefined;
                });
            }
        }

        let result = false;
        const unitHex = Hex.fromPosition(obj.getPosition());
        if (_legendaryMecatolAnomalyHexes.has(unitHex)) {
            result = unitHex;
        }
        if (world.__isMock) {
            _legendaryMecatolAnomalyHexes = undefined;
        }
        return result;
    }

    static getHexIfUnitIsInOrAdjacentToOthersHome(obj) {
        assert(obj instanceof GameObject);

        if (!_hexToHomeOrHomeAdjPlayerSlots) {
            _hexToHomeOrHomeAdjPlayerSlots = {};

            // Adjacency can return hexes without tiles.  Restrict to tiles.
            const restrictHexes = new Set();
            for (const systemTileObj of world.TI4.getAllSystemTileObjects()) {
                const pos = systemTileObj.getPosition();
                const hex = Hex.fromPosition(pos);
                restrictHexes.add(hex);
            }

            for (const systemTileObj of world.TI4.getAllSystemTileObjects()) {
                const system =
                    world.TI4.getSystemBySystemTileObject(systemTileObj);
                if (!system || !system.home) {
                    continue;
                }
                const pos = systemTileObj.getPosition();
                const hex = Hex.fromPosition(pos);
                const playerSlot = systemTileObj.getOwningPlayerSlot(); // set during faction unpack
                if (!_hexToHomeOrHomeAdjPlayerSlots[hex]) {
                    _hexToHomeOrHomeAdjPlayerSlots[hex] = new Set();
                }
                _hexToHomeOrHomeAdjPlayerSlots[hex].add(playerSlot);

                const adjHexes = Hex.neighbors(hex);
                for (const adjHex of adjHexes) {
                    if (!restrictHexes.has(adjHex)) {
                        continue;
                    }
                    if (!_hexToHomeOrHomeAdjPlayerSlots[adjHex]) {
                        _hexToHomeOrHomeAdjPlayerSlots[adjHex] = new Set();
                    }
                    _hexToHomeOrHomeAdjPlayerSlots[adjHex].add(playerSlot);
                }
            }
            if (!world.__isMock) {
                process.nextTick(() => {
                    _hexToHomeOrHomeAdjPlayerSlots = undefined;
                });
            }
        }

        let result = false;
        const unitHex = Hex.fromPosition(obj.getPosition());
        const hexPlayerSlots = _hexToHomeOrHomeAdjPlayerSlots[unitHex];
        const playerSlot = obj.getOwningPlayerSlot();
        if (
            hexPlayerSlots &&
            (hexPlayerSlots.size > 1 || !hexPlayerSlots.has(playerSlot))
        ) {
            result = unitHex;
        }
        if (world.__isMock) {
            _hexToHomeOrHomeAdjPlayerSlots = undefined;
        }
        return result;
    }

    static getHexIfUnitInMecatol(obj) {
        assert(obj instanceof GameObject);
        if (!_mecatolHex) {
            for (const systemTileObj of world.TI4.getAllSystemTileObjects()) {
                const system =
                    world.TI4.getSystemBySystemTileObject(systemTileObj);
                if (!system) {
                    continue;
                }
                if (system.tile === 18) {
                    const pos = systemTileObj.getPosition();
                    const hex = Hex.fromPosition(pos);
                    _mecatolHex = hex;
                    break;
                }
            }

            // Discard next frame because tiles can move
            // (schedule here so it only happens once).
            if (!world.__isMock) {
                process.nextTick(() => {
                    _mecatolHex = undefined;
                });
            }
        }

        let result = false;
        const unitHex = Hex.fromPosition(obj.getPosition());
        if (_mecatolHex === unitHex) {
            result = unitHex;
        }
        if (world.__isMock) {
            _mecatolHex = undefined;
        }
        return result;
    }

    static getHexIfUnitIsInOthersHomeSystem(obj) {
        assert(obj instanceof GameObject);

        if (!_hexToHomeSystemPlayerSlot) {
            _hexToHomeSystemPlayerSlot = {};

            // Skips contained objects, as well as tile 0 objects.
            for (const systemTileObj of world.TI4.getAllSystemTileObjects()) {
                const system =
                    world.TI4.getSystemBySystemTileObject(systemTileObj);
                if (!system) {
                    continue;
                }
                if (system.home) {
                    const pos = systemTileObj.getPosition();
                    const hex = Hex.fromPosition(pos);
                    const playerSlot = systemTileObj.getOwningPlayerSlot(); // set during faction unpack
                    _hexToHomeSystemPlayerSlot[hex] = playerSlot;
                }
            }

            // Discard next frame because tiles can move
            // (schedule here so it only happens once).
            if (!world.__isMock) {
                process.nextTick(() => {
                    _hexToHomeSystemPlayerSlot = undefined;
                });
            }
        }

        let result = false;
        const unitHex = Hex.fromPosition(obj.getPosition());
        const unitPlayerSlot = obj.getOwningPlayerSlot();
        const homePlayerSlot = _hexToHomeSystemPlayerSlot[unitHex];
        if (homePlayerSlot !== undefined && homePlayerSlot !== unitPlayerSlot) {
            result = unitHex;
        }
        if (world.__isMock) {
            _hexToHomeSystemPlayerSlot = undefined;
        }
        return result;
    }

    static getHexIfUnitIsInSystem(obj) {
        assert(obj instanceof GameObject);

        if (!_systemHexes) {
            _systemHexes = new Set();
            for (const systemTileObj of world.TI4.getAllSystemTileObjects()) {
                const pos = systemTileObj.getPosition();
                const hex = Hex.fromPosition(pos);
                _systemHexes.add(hex);
            }
        }

        let result = false;
        const unitHex = Hex.fromPosition(obj.getPosition());
        if (_systemHexes.has(unitHex)) {
            result = unitHex;
        }
        if (world.__isMock) {
            _systemHexes = undefined;
        }
        return result;
    }

    /**
     * Return the hex if object is in a zero-planet system.
     *
     * @param {GameObject} obj
     * @returns {string | undefined}
     */
    static getHexIfUnitIsInZeroPlanetSystem(obj) {
        assert(obj instanceof GameObject);
        const pos = obj.getPosition();
        const systemTileObj = world.TI4.getSystemTileObjectByPosition(pos);
        if (!systemTileObj) {
            return undefined;
        }
        const system = world.TI4.getSystemBySystemTileObject(systemTileObj);
        if (!system) {
            return undefined;
        }
        const planets = system.planets.filter((planet) => {
            return !planet.destroyed;
        });
        if (planets.length > 0) {
            return undefined;
        }
        return Hex.fromPosition(pos);
    }

    static getHexIfUnitIsOnEdgeOfGameBoardOtherThanHome(obj) {
        assert(obj instanceof GameObject);

        // Edge hexes are static, but only keep for one frame in case the
        // map is in flux.
        if (!_edgeOfGameBoardHexes) {
            _edgeOfGameBoardHexes = new Set();

            // Get hexes with tiles, ignoring off-map tiles (add those to edge set).
            const occupiedHexes = new Set();
            for (const systemTileObj of world.TI4.getAllSystemTileObjects()) {
                const system =
                    world.TI4.getSystemBySystemTileObject(systemTileObj);
                if (!system) {
                    continue;
                }
                const pos = systemTileObj.getPosition();
                const hex = Hex.fromPosition(pos);
                if (system.raw.offMap) {
                    _edgeOfGameBoardHexes.add(hex);
                } else {
                    occupiedHexes.add(hex);
                }
            }

            // Now look for occupied tiles with a missing neighbor.
            for (const occupiedHex of occupiedHexes) {
                const adjHexes = Hex.neighbors(occupiedHex);
                for (const adjHex of adjHexes) {
                    if (!occupiedHexes.has(adjHex)) {
                        _edgeOfGameBoardHexes.add(occupiedHex);
                        break;
                    }
                }
            }

            // Discard next frame because tiles can move
            // (schedule here so it only happens once).
            if (!world.__isMock) {
                process.nextTick(() => {
                    _edgeOfGameBoardHexes = undefined;
                });
            }
        }

        // Share this hex to home cache.
        if (!_hexToHomeSystemPlayerSlot) {
            _hexToHomeSystemPlayerSlot = {};

            // Skips contained objects, as well as tile 0 objects.
            for (const systemTileObj of world.TI4.getAllSystemTileObjects()) {
                const system =
                    world.TI4.getSystemBySystemTileObject(systemTileObj);
                if (!system) {
                    continue;
                }
                if (system.home) {
                    const pos = systemTileObj.getPosition();
                    const hex = Hex.fromPosition(pos);
                    const playerSlot = systemTileObj.getOwningPlayerSlot(); // set during faction unpack
                    _hexToHomeSystemPlayerSlot[hex] = playerSlot;
                }
            }

            // Discard next frame because tiles can move
            // (schedule here so it only happens once).
            if (!world.__isMock) {
                process.nextTick(() => {
                    _hexToHomeSystemPlayerSlot = undefined;
                });
            }
        }

        let result = false;
        const unitHex = Hex.fromPosition(obj.getPosition());
        const unitPlayerSlot = obj.getOwningPlayerSlot();
        const hexPlayerSlot = _hexToHomeSystemPlayerSlot[unitHex];
        if (
            _edgeOfGameBoardHexes.has(unitHex) &&
            unitPlayerSlot !== hexPlayerSlot
        ) {
            result = unitHex;
        }

        if (world.__isMock) {
            _edgeOfGameBoardHexes = undefined;
            _hexToHomeSystemPlayerSlot = undefined;
        }
        return result;
    }

    static getHexIfUnitIsOutsideHome(obj) {
        assert(obj instanceof GameObject);

        // Share this hex to home cache.
        if (!_hexToHomeSystemPlayerSlot) {
            _hexToHomeSystemPlayerSlot = {};

            // Skips contained objects, as well as tile 0 objects.
            for (const systemTileObj of world.TI4.getAllSystemTileObjects()) {
                const system =
                    world.TI4.getSystemBySystemTileObject(systemTileObj);
                if (!system) {
                    continue;
                }
                if (system.home) {
                    const pos = systemTileObj.getPosition();
                    const hex = Hex.fromPosition(pos);
                    const playerSlot = systemTileObj.getOwningPlayerSlot(); // set during faction unpack
                    _hexToHomeSystemPlayerSlot[hex] = playerSlot;
                }
            }

            // Discard next frame because tiles can move
            // (schedule here so it only happens once).
            if (!world.__isMock) {
                process.nextTick(() => {
                    _hexToHomeSystemPlayerSlot = undefined;
                });
            }
        }

        let result = false;
        const unitHex = Hex.fromPosition(obj.getPosition());
        const unitPlayerSlot = obj.getOwningPlayerSlot();
        const hexPlayerSlot = _hexToHomeSystemPlayerSlot[unitHex];
        if (unitPlayerSlot !== hexPlayerSlot) {
            result = unitHex;
        }
        if (world.__isMock) {
            _hexToHomeSystemPlayerSlot = undefined;
        }
        return result;
    }

    /**
     * Attachment count.
     *
     * @param {GameObject} obj : planet card
     * @returns {number}
     */
    static getPlanetAttachmentCount(obj) {
        assert(obj instanceof GameObject);
        const nsid = ObjectNamespace.getNsid(obj);
        if (!nsid.startsWith("card.planet")) {
            return 0;
        }
        const planet = world.TI4.getPlanetByCardNsid(nsid);
        if (!planet || planet.destroyed) {
            return 0;
        }
        // Not all attachments are "real".
        const legit = planet.attachments.filter((attachment) => {
            if (!attachment.getAttrs) {
                return false; // what's this?
            }
            const attrs = attachment.getAttrs();
            if (attrs.localeName === "token.attachment.custodia_vigilia") {
                return false;
            }
            if (attrs.localeName === "token.exploration.stellar_converter") {
                return false;
            }
            return true;
        });
        return legit.length;
    }

    /**
     * Influence value.
     *
     * @param {GameObject} obj : planet card
     * @returns {number}
     */
    static getPlanetInfluence(obj) {
        assert(obj instanceof GameObject);
        const nsid = ObjectNamespace.getNsid(obj);
        if (!nsid.startsWith("card.planet") || !Facing.isFaceUp(obj)) {
            return 0;
        }
        const planet = world.TI4.getPlanetByCardNsid(nsid);
        if (!planet) {
            return 0;
        }
        return planet.raw.influence;
    }

    /**
     * Resources value.
     *
     * @param {GameObject} obj : planet card
     * @returns {number}
     */
    static getPlanetResources(obj) {
        assert(obj instanceof GameObject);
        const nsid = ObjectNamespace.getNsid(obj);
        if (!nsid.startsWith("card.planet") || !Facing.isFaceUp(obj)) {
            return 0;
        }
        const planet = world.TI4.getPlanetByCardNsid(nsid);
        if (!planet) {
            return 0;
        }
        return planet.raw.resources;
    }

    /**
     * Tech specialty, if present.
     *
     * @param {GameObject} obj : planet card
     * @returns {Array.{string} | undefined}
     */
    static getPlanetTechSpecialties(obj) {
        assert(obj instanceof GameObject);
        const nsid = ObjectNamespace.getNsid(obj);
        if (!nsid.startsWith("card.planet")) {
            return 0;
        }
        const planet = world.TI4.getPlanetByCardNsid(nsid);
        if (!planet) {
            return 0;
        }
        return planet.raw.tech;
    }

    /**
     * Planet traits.
     *
     * @param {GameObject} obj : planet card
     * @returns {Array.{string} | undefined}
     */
    static getPlanetTraits(obj) {
        assert(obj instanceof GameObject);
        const nsid = ObjectNamespace.getNsid(obj);
        if (!nsid.startsWith("card.planet")) {
            return undefined;
        }
        const planet = world.TI4.getPlanetByCardNsid(nsid);
        if (!planet) {
            return undefined;
        }
        return planet.traits;
    }

    /**
     * If the object is a color tech card, return the color.
     *
     * @param {GameObject} obj
     * @returns {string | undefined}
     */
    static getTechnologyCardColor(obj) {
        assert(obj instanceof GameObject);
        const nsid = ObjectNamespace.getNsid(obj);
        if (!nsid.startsWith("card.technology")) {
            return undefined;
        }
        const parsed = ObjectNamespace.parseNsid(nsid);
        if (!parsed) {
            return undefined;
        }
        const parts = parsed.type.split(".");
        const color = parts[2]; // card.technology.green:base/hyper_metabolism
        if (!["blue", "green", "yellow", "red"].includes(color)) {
            return undefined;
        }
        return color;
    }

    /**
     * Tradegood value (NOT commodity value).
     *
     * @param {GameObject} obj
     * @returns {number}
     */
    static getTradeGoods(obj) {
        assert(obj instanceof GameObject);
        const nsid = ObjectNamespace.getNsid(obj);
        let value = 0;
        if (nsid === "token:base/tradegood_commodity_1") {
            value = 1;
        } else if (nsid === "token:base/tradegood_commodity_3") {
            value = 3;
        }
        if (value === 0) {
            return 0; // fast fail if not a tradegood
        }
        if (Facing.isFaceUp(obj)) {
            return 0; // commodity side
        }
        if (ObjectivesUtil._isOnStrategyCardMat(obj)) {
            return 0; // tg on unpicked strategy card
        }
        return value;
    }

    /**
     * Return the planet {tile, localName} tuple closest to this unit.
     *
     * @param {GameObject} obj
     * @returns {Object.{tile:number, localeName:string} | undefined}
     */
    static getUnitPlanet(obj) {
        assert(obj instanceof GameObject);
        const plastic = UnitPlastic.getOne(obj);
        if (!plastic) {
            return undefined;
        }
        UnitPlastic.assignPlanets([plastic]);
        if (!plastic.planet) {
            return undefined;
        }
        return {
            tile: plastic.planet.system.tile,
            localeName: plastic.planet.localeName,
        };
    }

    /**
     * Clone the seed value N times into a per-player desk array.
     *
     * @param {?} seed
     * @returns Array.{?}
     */
    static initialValues(seed) {
        assert(seed !== undefined);
        return world.TI4.getAllPlayerDesks().map(() => {
            return _.cloneDeep(seed);
        });
    }

    /**
     * Is the game object a flagship or war sun?
     *
     * @param {GameObject} obj
     * @returns {boolean}
     */
    static isFlagshipOrWarSun(obj) {
        assert(obj instanceof GameObject);
        const nsid = ObjectNamespace.getNsid(obj);
        return nsid === "unit:base/flagship" || nsid === "unit:base/war_sun";
    }

    /**
     * Is the game object a non-fighter ship?
     *
     * @param {GameObject} obj
     * @returns {boolean}
     */
    static isNonFighterShip(obj) {
        assert(obj instanceof GameObject);
        const plastic = UnitPlastic.getOne(obj);
        if (!plastic) {
            return false;
        }
        const unitAttrs = UnitAttrs.getDefaultUnitAttrs(plastic.unit);
        return unitAttrs.raw.ship && unitAttrs.unit !== "fighter";
    }

    /**
     * Is the game object a planet card not from a hone system?
     *
     * @param {GameObject} obj
     * @returns {boolean}
     */
    static isNonHomePlanetCard(obj) {
        assert(obj instanceof GameObject);
        const nsid = ObjectNamespace.getNsid(obj);
        if (!nsid.startsWith("card.planet")) {
            return false;
        }
        const planet = world.TI4.getPlanetByCardNsid(nsid);
        if (!planet) {
            return false;
        }
        return !planet.system.home;
    }

    /**
     * Is the game object a planet card in another player's home system?
     * (Assumes card is in owning player's area.)
     *
     * @param {GameObject} obj
     * @returns {boolean}
     */
    static isOthersHomePlanetCard(obj) {
        assert(obj instanceof GameObject);
        const nsid = ObjectNamespace.getNsid(obj);
        if (!nsid.startsWith("card.planet")) {
            return false;
        }
        const planet = world.TI4.getPlanetByCardNsid(nsid);
        if (!planet) {
            return false;
        }
        if (!planet.system.home) {
            return false;
        }
        const pos = obj.getPosition();
        const playerDesk = world.TI4.getClosestPlayerDesk(pos);
        const faction = world.TI4.getFactionByPlayerSlot(playerDesk.playerSlot);
        if (!faction) {
            return false;
        }
        return faction.home !== planet.system.tile;
    }

    /**
     * Is the game object a planet card?
     *
     * @param {GameObject} obj
     * @returns {boolean}
     */
    static isPlanetCard(obj) {
        assert(obj instanceof GameObject);
        const nsid = ObjectNamespace.getNsid(obj);
        if (!nsid.startsWith("card.planet")) {
            return false;
        }
        const planet = world.TI4.getPlanetByCardNsid(nsid);
        if (!planet) {
            return false;
        }
        return true;
    }

    /**
     * Is game object a ship unit?
     *
     * @param {GameObject} obj
     * @returns {boolean}
     */
    static isShip(obj) {
        assert(obj instanceof GameObject);
        const plastic = UnitPlastic.getOne(obj);
        if (!plastic) {
            return false;
        }
        const unitAttrs = UnitAttrs.getDefaultUnitAttrs(plastic.unit);
        return unitAttrs.raw.ship;
    }

    /**
     * Is the game object a structure?
     *
     * @param {GameObject} obj
     * @returns {boolean}
     */
    static isStructure(obj) {
        assert(obj instanceof GameObject);
        const nsid = ObjectNamespace.getNsid(obj);
        return nsid === "unit:base/pds" || nsid === "unit:base/space_dock";
    }

    /**
     * Is the game object a unit?
     *
     * @param {GameObject} obj
     * @returns {boolean}
     */
    static isUnit(obj) {
        assert(obj instanceof GameObject);
        const nsid = ObjectNamespace.getNsid(obj);
        return nsid.startsWith("unit:");
    }

    /**
     * Is the game object a unit upgrade technology?
     *
     * @param {GameObject} obj
     * @returns {boolean}
     */
    static isUnitUpgradeTechnology(obj) {
        assert(obj instanceof GameObject);
        const nsid = ObjectNamespace.getNsid(obj);
        return (
            nsid.startsWith("card.technology.unit_upgrade") &&
            !nsid.includes(":franken.base/")
        );
    }
}

module.exports = { ObjectivesUtil };
