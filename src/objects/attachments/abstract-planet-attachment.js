const assert = require("../../wrapper/assert-wrapper");
const { AbstractSystemAttachment } = require("./abstract-system-attachment");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { ATTACHMENTS } = require("./attachment.data");
const {
    Card,
    GameObject,
    ImageWidget,
    ObjectType,
    Rotator,
    UIElement,
    Vector,
    refPackageId,
} = require("../../wrapper/api");

/**
 * Mutate planet on attach/detach.
 */
class AbstractPlanetAttachment extends AbstractSystemAttachment {
    /**
     * Set up a known attachment token (registered in attachment.data).
     *
     * @param {GameObject} gameObject
     * @returns {AbstractPlanetAttachment}
     */
    static createForKnownAttachmentToken(gameObject) {
        assert(gameObject instanceof GameObject);
        const nsid = ObjectNamespace.getNsid(gameObject);
        let attrs = false;
        for (const candidate of ATTACHMENTS) {
            if (nsid === candidate.tokenNsid) {
                attrs = candidate;
                break;
            }
        }
        if (!attrs) {
            throw new Error(`KnownPlanetAttachment: no attrs for "${nsid}"`);
        }
        return new AbstractPlanetAttachment(
            gameObject,
            attrs,
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
    }

    place(system, planet, systemTileObj, faceUp) {
        this._positionOnPlanet(planet, systemTileObj);
        this._addPlanetAttrs(planet, faceUp);
    }

    remove(system, planet, systemTileObj, faceUp) {
        this._delPlanetAttrs(planet, faceUp);
    }

    _positionOnPlanet(planet, systemTileObj) {
        assert(systemTileObj instanceof GameObject);

        let numAttachments = planet.attachments.length;
        const steps = Math.floor(numAttachments / 3);
        if (steps % 2 === 1) {
            numAttachments += 0.5;
        }
        const phi = (numAttachments * 120 * Math.PI) / 180;
        const r = 1.05;
        const attachmentPosition = new Vector(
            planet.position.x - Math.sin(phi) * r,
            planet.position.y - Math.cos(phi) * r,
            0
        );
        const extraZ = steps * this._obj.getSize().z;
        const worldPosition = systemTileObj
            .localPositionToWorld(attachmentPosition)
            .add([0, 0, systemTileObj.getSize().z + extraZ]);

        this._obj.setObjectType(ObjectType.Regular);
        this._obj.setPosition(worldPosition, 0);
        this._obj.setObjectType(ObjectType.Ground);
    }

    _addPlanetAttrs(planet, faceUp) {
        assert(typeof faceUp === "boolean");
        planet.attachments.push(this);

        // Some attachments have not attributes (e.g. "DMZ")
        const attrs = faceUp ? this._attrs.faceUp : this._attrs.faceDown;
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
            if (!planet.raw.attrs) {
                planet.raw.attrs = [];
            }
            attrs.trait.forEach((element) => planet.raw.attrs.push(element));
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
        const attrs = faceUp ? this._attrs.faceUp : this._attrs.faceDown;
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

    // XXX TODO work in progress
    _addImageToPlanetCard(card, imagePath) {
        assert(card instanceof Card);
        assert(typeof imagePath === "string");
        console.log("XXX " + imagePath);

        const ui = new UIElement();
        ui.position = new Vector(0, 0, 0.1);
        ui.rotation = new Rotator(0, 0, 0);
        ui.scale = 0.3;
        ui.widget = new ImageWidget()
            .setImage(imagePath, refPackageId)
            .setImageSize(60, 60);

        card.addUI(ui);
    }
}

module.exports = { AbstractPlanetAttachment };
