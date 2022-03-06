const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { getClosestPlanet } = require("../../lib/system/position-to-planet");
const { Broadcast } = require("../../lib/broadcast");
const { System, Planet } = require("../../lib/system/system");
const { GameObject, globalEvents, world } = require("../../wrapper/api");

/**
 * Manage system attachments, may be generic (wormhole) or need a planet.
 * Subclasses should implement `place` and `remove`.
 * This triggers `globalEvents.TI4.onSystemChanged` events.
 */
class AbstractSystemAttachment {
    /**
     * Constructor.  If planet based place/remove will be given a planet
     * (and attach will fail if no planet).
     *
     * @param {GameObject} gameObject - attachment token gameObject
     * @param {boolean} isPlanetBased
     */
    constructor(gameObject, isPlanetBased, localeName) {
        assert(gameObject instanceof GameObject);
        assert(typeof isPlanetBased === "boolean");
        assert(typeof localeName === "string");

        this._obj = gameObject;
        this._isPlanetBased = isPlanetBased;
        this._localeName = localeName;

        this._attachedToSystemObj = undefined;
        this._attachedToSystem = undefined;
        this._attachedToPlanet = undefined;

        this._obj.onReleased.add(() => this._place());
        this._obj.onGrab.add(() => this._remove());
        this._obj.onCreated.add(() => this._place());

        // pressing f to flip does not trigger onReleased or onGrab
        // Also applies when moved by script!
        this._obj.onMovementStopped.add(() => this.attach());

        // DO NOT PLACE IN CONSTRUCTOR!  Subclass might not be fully
        // set up yet, have them call `attachIfOnSystem` when ready.
    }

    /**
     * Attach if on a system tile.  This may be called at the very end of
     * subclass constructor to attach on reload.
     *
     * @returns {AbstractSystemAttachment} self, for chaining
     */
    attachIfOnSystem() {
        this._place();
        return this;
    }

    /**
     * Subclass should override this to mutate system.
     *
     * @param {System} system
     * @param {Planet|undefined} planet - only if isPlanetBased
     * @param {GameObject} systemTileObj
     */
    place(system, planet, systemTileObj) {}

    /**
     * Subclass should override this to mutate system.
     *
     * @param {System} system
     * @param {Planet|undefined} planet - only if isPlanetBased
     * @param {GameObject} systemTileObj
     */
    remove(system, planet, systemTileObj) {}

    /**
     * Internal place support, calls `this.place(system, planet)`.
     */
    _place() {
        // Check where it would attach.
        const pos = this._obj.getPosition();
        const systemTileObj = world.TI4.getSystemTileObjectByPosition(pos);
        let system = undefined;
        let planet = undefined;
        if (systemTileObj) {
            system = world.TI4.getSystemBySystemTileObject(systemTileObj);
            if (system && this._isPlanetBased) {
                planet = getClosestPlanet(pos, systemTileObj);
            }
        }
        assert(!system || system instanceof System);
        assert(!planet || planet instanceof Planet);

        // Abort if nothing to attach to.
        if (!system || (this._isPlanetBased && !planet)) {
            return;
        }

        // Abort if already attached there.  This can happen when an attachment
        // is moved to a system tile, GameObject.onMovementStopped can be
        // called multiple times.
        if (
            this._attachedToSystem === system &&
            this._attachedToPlanet === planet
        ) {
            return;
        }

        // Detach if attached.
        if (this._attachedToSystemObj) {
            this._remove();
        }

        // Update state before calling subclass, it might trigger more updates.
        this._attachedToSystemTileObj = systemTileObj;
        this._attachedToSystem = system;
        this._attachedToPlanet = planet;

        // Announce.
        const message = locale("ui.message.attach_token", {
            attachmentName: locale(this._localeName),
            planetName: planet ? planet.getNameStr() : undefined,
        });
        Broadcast.chatAll(message);

        // Subclass time to work!
        this.place(system, planet, systemTileObj);

        // Let outsiders know something changed.  DO THIS LAST.
        globalEvents.TI4.onSystemChanged.trigger(systemTileObj);
    }

    /**
     * Internal remove support, calls `this.remove(system, planet)`.
     */
    _remove() {
        if (!this._attachedToSystemTileObj) {
            return;
        }

        // Update state before calling subclass, it might trigger more updates.
        const systemTileObj = this._attachedToSystemTileObj;
        const system = this._attachedToSystem;
        const planet = this._attachedToPlanet;
        this._attachedToSystemTileObj = undefined;
        this._attachedToSystem = undefined;
        this._attachedToPlanet = undefined;

        // Announce.
        const message = locale("ui.message.detach_token", {
            attachmentName: locale(this._localeName),
            planetName: planet ? planet.getNameStr() : undefined,
        });
        Broadcast.chatAll(message);

        // Subclass time to work!
        this.remove(system, planet, systemTileObj);

        // Let outsiders know something changed.  DO THIS LAST.
        globalEvents.TI4.onSystemChanged.trigger(systemTileObj);
    }
}

module.exports = { AbstractSystemAttachment };
