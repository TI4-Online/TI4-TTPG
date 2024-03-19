const assert = require("../../wrapper/assert-wrapper");
const locale = require("../../lib/locale");
const { getClosestPlanet } = require("../../lib/system/position-to-planet");
const { Broadcast } = require("../../lib/broadcast");
const { Facing } = require("../../lib/facing");
const { System, Planet } = require("../../lib/system/system");
const { GameObject, globalEvents, world } = require("../../wrapper/api");

/**
 * Manage system attachments, may be generic (wormhole) or need a planet.
 * Subclasses should implement `place` and `remove`.
 * This triggers `globalEvents.TI4.onSystemChanged` events.
 */
class AbstractSystemAttachment {
    static attachIfOnSystem(gameObject) {
        if (gameObject._placeAttachment) {
            console.log("AbstractSystemAttachment.attachIfOnSystem");
            gameObject._placeAttachment();
        }
    }

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

        // Expose via static method.
        gameObject._placeAttachment = () => this._place();

        this._obj = gameObject;
        this._isPlanetBased = isPlanetBased;
        this._localeName = localeName;

        this._attachLocaleMessage = "ui.message.attach_token";
        this._detachLocaleMessage = "ui.message.detach_token";

        this._attachedFaceUp = undefined;
        this._attachedToSystemObj = undefined;
        this._attachedToSystem = undefined;
        this._attachedToPlanet = undefined;

        this._obj.onGrab.add(() => this._remove());
        this._obj.onCreated.add(() => this._place());

        //this._obj.onReleased.add(() => this._place());
        // Enabling "always snap" in session options helps with some token stacking
        // issues, but apparenntly breaks onRelease (also does not call onSnapped,
        // onMovementStopped).
        this._obj.onGrab.add((obj, player) => {
            const tickHandler = () => {
                if (!obj.isHeld()) {
                    obj.onTick.remove(tickHandler);
                    this._place();
                }
            };
            obj.onTick.add(tickHandler);
        });

        // pressing f to flip does not trigger onReleased or onGrab
        // Also applies when moved by script!
        this._obj.onMovementStopped.add(() => this._place());

        // DO NOT CALL _PLACE IN CONSTRUCTOR!  Subclass might not be fully
        // set up yet, have them call `attachIfOnSystem` when ready.
    }

    isAttachedFaceUp() {
        return this._attachedFaceUp;
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

    getAttachTokenObj() {
        return this._obj;
    }

    /**
     * Subclass can override if they want to further control if attachable.
     *
     * @param {System} system
     * @param {Planet|undefined} planet - only if isPlanetBased
     * @param {GameObject} systemTileObj
     * @param {boolean} faceUp - attached token is face up?
     * @returns {boolean} true to allow attach
     */
    allow(system, planet, systemTileObj, faceUp) {
        return true;
    }

    /**
     * Subclass should override this to mutate system.
     *
     * @param {System} system
     * @param {Planet|undefined} planet - only if isPlanetBased
     * @param {GameObject} systemTileObj
     * @param {boolean} faceUp - attached token is face up?
     */
    place(system, planet, systemTileObj, faceUp) {}

    /**
     * Subclass should override this to mutate system.
     *
     * @param {System} system
     * @param {Planet|undefined} planet - only if isPlanetBased
     * @param {GameObject} systemTileObj
     * @param {boolean} faceUp - attached token is face up?
     */
    remove(system, planet, systemTileObj, faceUp) {}

    /**
     * Internal place support, calls `this.place(system, planet)`.
     */
    _place() {
        // Check where it would attach.
        const faceUp = Facing.isFaceUp(this._obj);
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

        // Abort if subclass rejects.
        if (!this.allow(system, planet, systemTileObj, faceUp)) {
            return;
        }

        // Abort if already attached there.  This can happen when an attachment
        // is moved to a system tile, GameObject.onMovementStopped can be
        // called multiple times.
        if (
            this._attachedFaceUp === faceUp &&
            this._attachedToSystem === system &&
            this._attachedToPlanet === planet
        ) {
            return;
        }

        // Detach if attached.
        if (this._attachedToSystemTileObj) {
            this._remove();
        }

        // Update state before calling subclass, it might trigger more updates.
        this._attachedFaceUp = faceUp;
        this._attachedToSystemTileObj = systemTileObj;
        this._attachedToSystem = system;
        this._attachedToPlanet = planet;

        // Announce.
        const message = locale(this._attachLocaleMessage, {
            attachmentName: locale(this._localeName),
            planetName: planet
                ? planet.getNameStr()
                : locale("ui.message.system_name", {
                      systemTile: system.tile,
                      systemName: system.getSummaryStr(),
                  }),
        });
        Broadcast.chatAll(message);

        // Subclass time to work!
        this.place(system, planet, systemTileObj, faceUp);

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
        const faceUp = this._attachedFaceUp;
        const systemTileObj = this._attachedToSystemTileObj;
        const system = this._attachedToSystem;
        const planet = this._attachedToPlanet;
        this._attachedFaceUp = undefined;
        this._attachedToSystemTileObj = undefined;
        this._attachedToSystem = undefined;
        this._attachedToPlanet = undefined;

        // Announce.
        const message = locale(this._detachLocaleMessage, {
            attachmentName: locale(this._localeName),
            planetName: planet
                ? planet.getNameStr()
                : locale("ui.message.system_name", {
                      systemTile: system.tile,
                      systemName: system.getSummaryStr(),
                  }),
        });
        Broadcast.chatAll(message);

        // Subclass time to work!
        this.remove(system, planet, systemTileObj, faceUp);

        // Let outsiders know something changed.  DO THIS LAST.
        globalEvents.TI4.onSystemChanged.trigger(systemTileObj);
    }
}

module.exports = { AbstractSystemAttachment };
