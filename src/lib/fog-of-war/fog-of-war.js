// Silly fog-of-war mode: players may only see systems where the have units or adjacent.
// Adjacency includes wormholes and hyperlanes.

// Update single system visibility during activation, adjacent visibility on turn change.
// That way, if a probe ship visits a system and is destroyed, the adjacent stay secret.

// Only apply to seat colors, observers can vet legality.  Some way for them to view
// from player perspective?

// Requires correct unit placement, dropping a unit on a system by mistake may reveal fog.

const assert = require("../../wrapper/assert-wrapper");
const locale = require("../locale");
const { AdjacencyHyperlane } = require("../system/adjacency-hyperlane");
const { AdjacencyNeighbor } = require("../system/adjacency-neighbor");
const { AdjacencyWormhole } = require("../system/adjacency-wormhole");
const { Borders } = require("../borders/borders");
const { CommandToken } = require("../../lib/command-token/command-token");
const { Hex } = require("../hex");
const { ObjectNamespace } = require("../object-namespace");
const {
    Button,
    Canvas,
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

    static createSystemStandInUi(systemTileObj, system, pos) {
        assert(typeof system.tile === "number");

        const resolutionScale = 4;
        const imgPath = system.raw.img;
        const hexSize = 115 * Hex.SCALE * resolutionScale;
        const imgSize = hexSize * SYSTEM_UI_STAND_IN_SHRINK;
        const img = new ImageWidget()
            .setImage(imgPath, refPackageId)
            .setImageSize(imgSize, imgSize);

        const buttonW = imgSize / 2;
        const buttonH = imgSize / 8;
        const buttonLeft = (imgSize - buttonW) / 2;
        const buttonTop = (imgSize - buttonH) / 2;
        const activateButton = new Button()
            .setFontSize(16)
            .setText(locale("ui.action.system.activate"));
        activateButton.onClicked.add((button, player) => {
            CommandToken.activateSystem(systemTileObj, player);
        });

        const canvas = new Canvas()
            .addChild(img, 0, 0, imgSize, imgSize)
            .addChild(activateButton, buttonLeft, buttonTop, buttonW, buttonH);

        const uiElement = new UIElement();
        uiElement.position = pos;
        uiElement.useWidgetSize = false;
        uiElement.width = imgSize;
        uiElement.height = imgSize;
        uiElement.scale = 1 / resolutionScale;
        uiElement.widget = canvas;

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
        this._standInUi = FogOfWarZone.createSystemStandInUi(
            systemTileObj,
            system,
            uiPos
        );

        systemTileObj.onDestroyed.add(() => {
            this._zone.destroy();
            delete _hexToFogOfWarZone[this._hex];
        });

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
        this._slotToSpecators = {};

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
            console.log("FogOfWar._onSystemActivatedHandler");
            const pos = systemObj.getPosition();
            const hex = Hex.fromPosition(pos);
            const fogOfWarZone = _hexToFogOfWarZone[hex];
            if (fogOfWarZone && player) {
                const playerSlot = player.getSlot();
                fogOfWarZone._zone.setSlotOwns(playerSlot, true);
                // do NOT call this.update, that would clobber this temporary owner
                // TODO XXX SPECATORS
            }
        };

        this._doUpdateHandler = () => {
            console.log("FogOfWar._doUpdateHandler");
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
        globalEvents.TI4.onFactionChanged.add(this._doUpdateHandler);
        globalEvents.TI4.onTurnChanged.add(this._doUpdateHandler);
        globalEvents.onObjectCreated.add(this._maybeAddFogHandler);

        this.update();
    }

    disable() {
        this._enabled = false; // TODO UPDATE IN GLOBAL DATA
        globalEvents.TI4.onSystemActivated.remove(
            this._onSystemActivatedHandler
        );
        globalEvents.TI4.onFactionChanged.remove(this._doUpdateHandler);
        globalEvents.TI4.onTurnChanged.remove(this._doUpdateHandler);
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

    /**
     * Let the spectator view as if the given slot.
     *
     * @param {number} spectatorSlot
     * @param {number} viewAsSlot
     */
    setViewAs(spectatorSlot, viewAsSlot) {
        assert(typeof spectatorSlot === "number");
        assert(typeof viewAsSlot === "number");
        for (const spectators of Object.values(this._slotToSpecators)) {
            spectators.delete(spectatorSlot);
        }
        let spectators = this._slotToSpecators[viewAsSlot];
        if (!spectators) {
            spectators = new Set();
            this._slotToSpecators[viewAsSlot] = spectators;
        }
        spectators.add(spectatorSlot);
    }

    update() {
        // Create sets.
        const hexToOwners = {};
        const hexToOwnersWithAdjacent = {};
        const hexToAdjacentCommon = {};
        for (const hex of Object.keys(_hexToFogOfWarZone)) {
            hexToOwners[hex] = new Set();
            hexToOwnersWithAdjacent[hex] = new Set();
            hexToAdjacentCommon[hex] = new Set();
        }

        // Compute owners.
        const controlEntries = Borders.getAllControlEntries();
        for (const controlEntry of controlEntries) {
            assert(typeof controlEntry.hex === "string");
            assert(typeof controlEntry.playerSlot === "number");
            const owners = hexToOwners[controlEntry.hex];
            owners.add(controlEntry.playerSlot);
        }

        // Compute adjacency.  Do wormholes on a per-player basis.
        for (const [hex, adjHexes] of Object.entries(hexToAdjacentCommon)) {
            const adjNeighbor = new AdjacencyNeighbor(hex);
            for (const adjHex of adjNeighbor.getAdjacent()) {
                if (hexToAdjacentCommon[adjHex]) {
                    adjHexes.add(adjHex);
                }
            }

            const adjHyperlane = new AdjacencyHyperlane(hex);
            for (const adjHex of adjHyperlane.getAdjacent()) {
                if (hexToAdjacentCommon[adjHex]) {
                    adjHexes.add(adjHex);
                }
            }

            // This hex is not considered adjacent here, even if wormhole, etc.
            adjHexes.delete(hex);
        }

        // Fold in adjacency.  Compute wormhole adjacency on a
        // per-player basis as they may have different connectivity (Ghosts).
        for (const [hex, owners] of Object.entries(hexToOwners)) {
            const adjacentCommon = hexToAdjacentCommon[hex];
            for (const owner of owners) {
                // Copy owner to current hex.
                hexToOwnersWithAdjacent[hex].add(owner);

                // Copy owner to common adjacent hexes.
                for (const adjHex of adjacentCommon) {
                    if (hexToOwnersWithAdjacent[adjHex]) {
                        hexToOwnersWithAdjacent[adjHex].add(owner);
                    }
                }

                // Copy owner to wormhole adjacent hexes.
                const adjWormhole = new AdjacencyWormhole(hex, owner);
                for (const adjHex of adjWormhole.getAdjacent()) {
                    if (hexToOwnersWithAdjacent[adjHex]) {
                        hexToOwnersWithAdjacent[adjHex].add(owner);
                    }
                }
            }
        }

        // Add spectators.  Spectators are manually registered, not just
        // unseated players because players may disconnect and re-join.
        for (const owners of Object.values(hexToOwnersWithAdjacent)) {
            const addSet = new Set();
            for (const owner of owners) {
                const spectators = this._slotToSpecators[owner];
                if (spectators) {
                    for (const specator of spectators) {
                        addSet.add(specator);
                    }
                }
            }
            for (const add of addSet) {
                owners.add(add);
            }
        }

        // Set owners.
        for (const [hex, owners] of Object.entries(hexToOwnersWithAdjacent)) {
            const fogOfWarZone = _hexToFogOfWarZone[hex];
            if (fogOfWarZone) {
                fogOfWarZone.setOwners(owners);
            }
        }

        // Return owners for testing.
        return hexToOwnersWithAdjacent;
    }
}

module.exports = { FogOfWar };
