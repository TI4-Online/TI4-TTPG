// Silly fog-of-war mode: players may only see systems where the have units or adjacent.
// Adjacency includes wormholes and hyperlanes.

// Update single system visibility during activation, adjacent visibility on turn change.
// That way, if a probe ship visits a system and is destroyed, the adjacent stay secret.

// Only apply to seat colors, observers can vet legality.  Some way for them to view
// from player perspective?

// Requires correct unit placement, dropping a unit on a system by mistake may reveal fog.

const assert = require("../../wrapper/assert-wrapper");
const { AdjacencyHyperlane } = require("../system/adjacency-hyperlane");
const { AdjacencyNeighbor } = require("../system/adjacency-neighbor");
const { AdjacencyWormhole } = require("../system/adjacency-wormhole");
const { Borders } = require("../borders/borders");
const { Hex } = require("../hex");
const { ObjectNamespace } = require("../object-namespace");
const {
    ImageWidget,
    UIElement,
    Vector,
    ZonePermission,
    ZoneShape,
    globalEvents,
    refPackageId,
    world,
} = require("../../wrapper/api");

const ZONE_HEIGHT = 10;
const SYSTEM_UI_STAND_IN_SHRINK = 0.5;

// Zones persist across save/load.
const ZONE_ID_PREFIX = "__fog__";
let _zoneIdToZone = undefined;

let _hexToFogOfWarZone = undefined;

/**
 * Manage the zone and stand-in UI for a single system tile.
 */
class FogOfWarZone {
    static buildZoneIdToZone() {
        if (!_zoneIdToZone) {
            _zoneIdToZone = {};
            for (const zone of world.getAllZones()) {
                const thisZoneId = zone.getSavedData();
                if (thisZoneId.startsWith(ZONE_ID_PREFIX)) {
                    //zone.destroy();
                    _zoneIdToZone[thisZoneId] = zone;
                }
            }
        }
    }

    static getZoneById(zoneId, pos) {
        FogOfWarZone.buildZoneIdToZone();
        let zone = _zoneIdToZone[zoneId];
        if (zone) {
            zone.setPosition(pos);
        } else {
            zone = world.createZone(pos);
            zone.setAlwaysVisible(false);
            zone.setColor([1, 1, 1, 0.2]);
            zone.setObjectVisibility(ZonePermission.OwnersOnly);
            zone.setSavedData(zoneId);
            zone.setScale(
                new Vector(Hex.HALF_SIZE * 2, Hex.HALF_SIZE * 2, ZONE_HEIGHT)
            );
            zone.setShape(ZoneShape.Hexagon);
            _zoneIdToZone[zoneId] = zone;
        }
        return zone;
    }

    static createSystemStandInUi(system, pos) {
        assert(typeof system.tile === "number");

        const resolutionScale = 4;
        const imgPath = system.raw.img;
        const size = 115 * SYSTEM_UI_STAND_IN_SHRINK * resolutionScale;
        const img = new ImageWidget()
            .setImage(imgPath, refPackageId)
            .setImageSize(size * Hex.SCALE, size * Hex.SCALE);

        const uiElement = new UIElement();
        uiElement.position = pos;
        uiElement.widget = img;
        uiElement.scale = 1 / resolutionScale;

        // Attach as world UI so remains visible when system tile is hidden.
        world.addUI(uiElement);
        return uiElement;
    }

    constructor(systemTileObj) {
        assert(ObjectNamespace.isSystemTile(systemTileObj));

        this._systemTileObj = systemTileObj;
        this._system = world.TI4.getSystemBySystemTileObject(systemTileObj);
        this._zoneId = ZONE_ID_PREFIX + systemTileObj.getId();
        this._hex = Hex.fromPosition(this._systemTileObj.getPosition());

        assert(this._system);

        const zoneId = this._zoneId;
        const zonePos = this.getZonePos();
        this._zone = FogOfWarZone.getZoneById(zoneId, zonePos);

        const system = this._system;
        const uiPos = this.getSystemStandInUiPos();
        this._standInUi = FogOfWarZone.createSystemStandInUi(system, uiPos);

        const updateStuff = () => {
            // Move zone.
            this._zone.setPosition(this.getZonePos());

            // Update stand-in UI.
            this._standInUi.position = this.getSystemStandInUiPos();
            world.updateUI(this._standInUi);

            // Update hex to zone.
            this._hex = Hex.fromPosition(this._systemTileObj.getPosition());
            _hexToFogOfWarZone[this._hex] = this;
        };
        systemTileObj.onMovementStopped.add(updateStuff);
        updateStuff();
    }

    /**
     * Position zone above system tile.  Zone overlaps tile!
     *
     * @returns {Vector} Zone setPosition value
     */
    getZonePos() {
        let pos = this._systemTileObj.getPosition();
        pos.z = world.getTableHeight() + ZONE_HEIGHT / 2 - 0.5;
        return pos;
    }

    getSystemStandInUiPos() {
        return this._systemTileObj.getPosition();
    }

    setOwners(playerSlotSet) {
        // Add new owners.
        for (const playerSlot of playerSlotSet) {
            this._zone.setSlotOwns(playerSlot, true);
        }
        // Remove any extra.
        for (const playerSlot of this._zone.getOwningSlots()) {
            if (!playerSlotSet.has(playerSlot)) {
                this._zone.setSlotOwns(playerSlot, false);
            }
        }
    }
}

/**
 * Manage the overall fog-of-war system.
 */
class FogOfWar {
    constructor() {
        this._enabled = false; // TODO STORE IN GLOBAL DATA
        this._fogOfWarZones = undefined;
        this._specatorsCanSeePlayerIndicies = new Set();

        this._maybeAddFogHandler = (obj) => {
            if (!this.isEnabled()) {
                return;
            }
            if (obj.getContainer()) {
                return;
            }
            if (!ObjectNamespace.isSystemTile(obj)) {
                return;
            }
            if (!world.TI4.getSystemBySystemTileObject(obj)) {
                return; // anonymous home system tile
            }
            const fogOfWarZone = new FogOfWarZone(obj);
            this._fogOfWarZones.push(fogOfWarZone);
        };

        this._onSystemActivatedHandler = (systemObj, player) => {
            const pos = systemObj.getPosition();
            const hex = Hex.fromPosition(pos);
            const fogOfWarZone = _hexToFogOfWarZone[hex];
            if (fogOfWarZone && player) {
                const playerSlot = player.getSlot();
                fogOfWarZone._zone.setSlotOwns(playerSlot, true);
            }
        };

        this._onTurnChangedHandler = () => {
            this.update();
        };
    }

    setEnabled(value) {
        if (value) {
            this.enable();
        } else {
            this.disable();
        }
    }

    isEnabled() {
        return this._enabled;
    }

    maybeEnable() {
        // TODO XXX restore after save/load here.
    }

    enable() {
        if (this._enabled) {
            return; // already enabled
        }
        this._fogOfWarZones = [];
        this._enabled = true; // TODO UPDATE IN GLOBAL DATA
        _hexToFogOfWarZone = {};
        for (const obj of world.getAllObjects()) {
            this._maybeAddFogHandler(obj);
        }
        globalEvents.TI4.onSystemActivated.add(this._onSystemActivatedHandler);
        globalEvents.TI4.onTurnChanged.add(this._onTurnChangedHandler);
        globalEvents.onObjectCreated.add(this._maybeAddFogHandler);

        this.update();
    }

    disable() {
        this._enabled = false; // TODO UPDATE IN GLOBAL DATA
        globalEvents.TI4.onSystemActivated.remove(
            this._onSystemActivatedHandler
        );
        globalEvents.TI4.onTurnChanged.remove(this._onTurnChangedHandler);
        globalEvents.onObjectCreated.remove(this._maybeAddFogHandler);

        // Remove system UI.
        if (this._fogOfWarZones) {
            for (const fogOfWarZone of this._fogOfWarZones) {
                world.removeUIElement(fogOfWarZone._standInUi);
            }
            this._fogOfWarZones = undefined;
        }

        // Remove zones.
        FogOfWarZone.buildZoneIdToZone();
        for (const zone of Object.values(_zoneIdToZone)) {
            zone.destroy();
        }
        _zoneIdToZone = undefined;
        _hexToFogOfWarZone = undefined;
    }

    update() {
        // Create sets.
        const hexToAdjacent = {};
        const hexToOwners = {};
        const hexToOwnersWithAdjacent = {};
        for (const hex of Object.keys(_hexToFogOfWarZone)) {
            hexToAdjacent[hex] = new Set();
            hexToOwners[hex] = new Set();
            hexToOwnersWithAdjacent[hex] = new Set();
        }

        for (const [hex, adjHexes] of Object.entries(hexToAdjacent)) {
            new AdjacencyHyperlane(hex).getAdjacent();
            const adjNeighbor = new AdjacencyNeighbor(hex);
            for (const adjHex of adjNeighbor.getAdjacent()) {
                adjHexes.add(adjHex);
            }

            const playerSlot = -1; // from player perspective TODO XXX GHOSTS
            const adjWormhole = new AdjacencyWormhole(hex, playerSlot);
            for (const adjHex of adjWormhole.getAdjacent()) {
                adjHexes.add(adjHex);
            }

            const adjHyperlane = new AdjacencyHyperlane(hex);
            for (const adjHex of adjHyperlane.getAdjacent()) {
                adjHexes.add(adjHex);
            }

            // This hex is not considered adjacent here, even if wormhole, etc.
            adjHexes.delete(hex);
        }

        // Compute owners.
        const controlEntries = Borders.getAllControlEntries();
        for (const controlEntry of controlEntries) {
            assert(typeof controlEntry.hex === "string");
            assert(typeof controlEntry.playerSlot === "number");
            const owners = hexToOwners[controlEntry.hex];
            owners.add(controlEntry.playerSlot);
        }

        // Expand to adjacent.
        for (const [hex, owners] of Object.entries(hexToOwners)) {
            for (const owner of owners) {
                hexToOwnersWithAdjacent[hex].add(owner);
                for (const adjHex of hexToAdjacent[hex]) {
                    if (hexToOwnersWithAdjacent[adjHex]) {
                        hexToOwnersWithAdjacent[adjHex].add(owner);
                    }
                }
            }
        }

        // Set owners.
        for (const [hex, owners] of Object.entries(hexToOwnersWithAdjacent)) {
            const fogOfWarZone = _hexToFogOfWarZone[hex];
            if (fogOfWarZone) {
                fogOfWarZone.setOwners(owners);
            }
        }
    }
}

module.exports = { FogOfWar };
