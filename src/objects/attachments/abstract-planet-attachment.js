const assert = require("../../wrapper/assert-wrapper");
const { AbstractSystemAttachment } = require("./abstract-system-attachment");
const { Explore } = require("../../lib/explore/explore");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { Attachment } = require("./attachment");
const { GameObject, Vector } = require("../../wrapper/api");

/**
 * Mutate planet on attach/detach.
 */
class AbstractPlanetAttachment extends AbstractSystemAttachment {
    /**
     *
     * @param {GameObject} gameObject
     */
    static delayedCreateForKnownAttachmentToken(gameObject) {
        assert(gameObject instanceof GameObject);
        process.nextTick(() => {
            AbstractPlanetAttachment.createForKnownAttachmentToken(gameObject);
        });
    }

    /**
     * Set up a known attachment token (registered in attachment.data and via homebrew.injectAttachment).
     *
     * USE THE DELAYED VERSION (particularly for homebrew) to make sure injection is done.
     *
     * @param {GameObject} gameObject
     * @returns {AbstractPlanetAttachment}
     */
    static createForKnownAttachmentToken(gameObject) {
        assert(gameObject instanceof GameObject);

        const nsid = ObjectNamespace.getNsid(gameObject);
        let attrs = Attachment.getByTokenNsidName(nsid);

        if (!attrs) {
            throw new Error(`KnownPlanetAttachment: no attrs for "${nsid}"`);
        }
        return new AbstractPlanetAttachment(
            gameObject,
            attrs.raw,
            attrs.localeName
        ).attachIfOnSystem();
    }

    /**
     * Constructor.
     *
     * Attrs should include `faceUp` for default adjustments and may
     * include optional `faceDown` if different from up.
     *
     * @param {GameObject} gameObject - attachment token
     * @param {Object} attrs
     */
    constructor(gameObject, attrs, localeName) {
        assert(gameObject instanceof GameObject);
        assert(attrs instanceof Object);
        assert(typeof localeName === "string");
        const isPlanetBased = true;
        super(gameObject, isPlanetBased, localeName);

        this._obj = gameObject;
        this._attrs = attrs;
        this._originallyLegendary = false;
        this._slot = -1;
    }

    getAttrs() {
        return this._attrs;
    }

    getFaceAttrs(faceUp) {
        assert(typeof faceUp === "boolean");
        let attrs = this._attrs.faceUp;
        if (!faceUp && this._attrs.faceDown) {
            attrs = this._attrs.faceDown;
        }
        return attrs;
    }

    place(system, planet, systemTileObj, faceUp) {
        assert(typeof faceUp === "boolean");

        this._positionOnPlanet(planet, systemTileObj);
        this._addPlanetAttrs(planet, faceUp); // adds to planet.attachments
    }

    remove(system, planet, systemTileObj, faceUp) {
        assert(typeof faceUp === "boolean");

        this._slot = -1;
        this._delPlanetAttrs(planet, faceUp);
    }

    _positionOnPlanet(planet, systemTileObj) {
        assert(systemTileObj instanceof GameObject);

        const slotted = new Set();
        for (const attachment of planet.attachments) {
            const slot = attachment._slot;
            assert(typeof slot === "number");
            if (slot >= 0) {
                slotted.add(slot);
            }
        }

        // Look for an empty slot, note <= for considering next.
        let slot = -1;
        for (let i = 0; i <= planet.attachments.length; i++) {
            if (!slotted.has(i)) {
                slot = i;
                break;
            }
        }
        assert(slot >= 0);
        this._slot = slot;

        let slotExtra = 0;
        const steps = Math.floor(slot / 3);
        if (steps % 2 === 1) {
            slotExtra = 0.5;
        }
        const phi = ((slot + slotExtra) * 120 * Math.PI) / 180;
        const r = 1.05;
        const attachmentPosition = new Vector(
            planet.position.x - Math.sin(phi) * r,
            planet.position.y - Math.cos(phi) * r,
            0
        );

        const tokenObj = this.getAttachTokenObj();
        const extraZ = steps * tokenObj.getSize().z;
        const worldPosition = systemTileObj
            .localPositionToWorld(attachmentPosition)
            .add([0, 0, systemTileObj.getSize().z + extraZ]);

        // Watch out for place re-triggering onMovementStopped, ignore if already
        // at location.
        const p = tokenObj.getPosition();
        const dx = p.x - worldPosition.x;
        const dy = p.y - worldPosition.y;
        const dSq = dx * dx + dy * dy;
        if (dSq < 0.1) {
            return;
        }

        // Fix yaw to match system tile.
        const rot = tokenObj.getRotation();
        rot.yaw = systemTileObj.getRotation().yaw;

        // Move other objects at the spot up slightly.
        // Physics *should* handle things, but be safe(r).
        Explore.reserveTokenSpaceAndAnchorToken(tokenObj, worldPosition, rot);
    }

    _addPlanetAttrs(planet, faceUp) {
        assert(typeof faceUp === "boolean");

        planet.attachments.push(this);

        // Some attachments have not attributes (e.g. "DMZ")
        const attrs = this.getFaceAttrs(faceUp);
        if (!attrs) {
            return;
        }

        if (attrs.resources) {
            planet.raw.resources += attrs.resources;
        }
        if (attrs.influence) {
            planet.raw.influence += attrs.influence;
        }
        if (attrs.legendary) {
            // Track if the planet was legendary to begin with, so when
            // we detach we can set its legendary status properly
            this._originallyLegendary = planet.raw.legendary;
            planet.raw.legendary = true;
        }
        if (attrs.trait) {
            if (!planet.raw.trait) {
                planet.raw.trait = [];
            }
            attrs.trait.forEach((element) => planet.raw.trait.push(element));
        }
        if (attrs.tech) {
            if (!planet.raw.tech) {
                planet.raw.tech = [];
            }
            attrs.tech.forEach((element) => planet.raw.tech.push(element));
        }
    }

    _delPlanetAttrs(planet, faceUp) {
        assert(typeof faceUp === "boolean");

        const index = planet.attachments.indexOf(this);
        if (index >= 0) {
            planet.attachments.splice(index, 1);
        }

        // Some attachments have not attributes (e.g. "DMZ")
        const attrs = this.getFaceAttrs(faceUp);
        if (!attrs) {
            return;
        }

        if (attrs.resources) {
            planet.raw.resources -= attrs.resources;
        }
        if (attrs.influence) {
            planet.raw.influence -= attrs.influence;
        }
        if (attrs.legendary) {
            // Reset legendary status to initial state
            planet.raw.legendary = this._originallyLegendary;
        }
        if (attrs.trait) {
            attrs.trait.forEach((element) => {
                const index = planet.raw.trait.indexOf(element);
                planet.raw.trait.splice(index, 1);
            });
        }
        if (attrs.tech) {
            attrs.tech.forEach((element) => {
                const index = planet.raw.tech.indexOf(element);
                planet.raw.tech.splice(index, 1);
            });
        }
    }
}

module.exports = { AbstractPlanetAttachment };
