const { getClosestPlanet } = require("../../lib/system/position-to-planet");
const { Facing } = require("../../lib/facing");
const { Broadcast } = require("../../lib/broadcast");
const { Planet } = require("../../lib/system/system");
const locale = require("../../lib/locale");
const assert = require("../../wrapper/assert-wrapper");
const { world, GameObject, ObjectType, Vector } = require("../../wrapper/api");

class Attachment {
    constructor(gameObject, attributes) {
        assert(gameObject instanceof GameObject);

        this._obj = gameObject;
        this._attributes = attributes;
        this._localeName = locale(attributes.localeName);
        this._faceUp = attributes.faceUp;
        this._faceDown = attributes.faceDown;

        // track which system/planet the attachment is on so we
        // don't have to go searching for it
        this._systemTile = 0;
        this._planetName = "";

        this._attachedFaceUp = true;

        // arrow functions necessary to get the proper "this" value
        this._obj.onReleased.add(() => this.attach());
        this._obj.onGrab.add(() => this.detach());
        this._obj.onCreated.add(() => this.attach());

        // pressing f to flip does not trigger onReleased or onGrab
        this._obj.onMovementStopped.add(() => this.attach());

        if (world.getExecutionReason() === "ScriptReload") {
            this.attach();
        }

        // Expose attach function for external attach (e.g. explore).
        this._obj.__attachment = this;
    }

    get attributes() {
        return this._attributes;
    }

    attach(planet = false, systemTileObj = false) {
        this.detach();

        // is the attachment on a system tile?
        if (!systemTileObj) {
            systemTileObj = world.TI4.getSystemTileObjectByPosition(
                this._obj.getPosition()
            );
        }
        if (!systemTileObj) {
            return;
        }

        // attach to the given Planet or if no planet is given attach to the
        // nearest planet
        if (!planet) {
            planet = getClosestPlanet(this._obj.getPosition());
        }
        assert(planet instanceof Planet);

        this._systemTile = planet.system.tile;
        this._planetName = planet.localeName;

        const message = locale("ui.message.attach_token", {
            attachmentName: this._localeName,
            planetName: planet.getNameStr(),
        });
        Broadcast.chatAll(message);

        // update the planet attributes based on the attachment
        if (Facing.isFaceUp(this._obj)) {
            this._attach(planet, this._faceUp);
        } else {
            this._attachedFaceUp = false;
            this._attach(planet, this._faceDown);
        }

        // TODO: add the attachment icon to the planet card

        // Move and lock the attachment object to the proper location
        // Currently fits 3 comfortably.
        const numAttachments = planet.attachments.length;
        const phi = ((numAttachments - 1) * 120 * Math.PI) / 180;
        const r = 1.05;
        const attachmentPosition = new Vector(
            planet.position.x - Math.sin(phi) * r,
            planet.position.y - Math.cos(phi) * r,
            systemTileObj.getSize().z + (numAttachments % 2) * 0.01
        );
        const worldPosition =
            systemTileObj.localPositionToWorld(attachmentPosition);
        this._obj.setPosition(worldPosition);
        //this._obj.setScale(systemTileObj.getScale());
        this._obj.setObjectType(ObjectType.Ground);

        return this;
    }

    _attach(planet, attrs) {
        if (!attrs) {
            return; // DMZ does not modify the planet attributes
        }
        if (attrs.resources) {
            planet.raw.resources += attrs.resources;
        }
        if (attrs.influence) {
            planet.raw.influence += attrs.influence;
        }
        if (attrs.legendary) {
            // track if the planet was legendary to begin with, so when
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
        planet.attachments.push(this);
    }

    detach() {
        if (!this._systemTile) {
            return; // not yet attached therefore nothing to do
        }

        const prevSystem = world.TI4.getSystemByTileNumber(this._systemTile);
        const prevPlanet = prevSystem.planets.filter(
            (element) => element.localeName === this._planetName
        )[0];

        const message = locale("ui.message.detach_token", {
            attachmentName: this._localeName,
            planetName: prevPlanet.getNameStr(),
        });
        Broadcast.chatAll(message);

        // revert the planet attributes to before the attachment
        if (this._attachedFaceUp) {
            this._detach(prevPlanet, this._faceUp);
        } else {
            this._detach(prevPlanet, this._faceDown);
        }

        this._systemTile = 0;
        this._planetName = "";

        // TODO: remove the attachment icon from the planet card
    }

    _detach(planet, attrs) {
        if (!attrs) {
            return; // DMZ does not modify the planet attributes
        }
        if (attrs.resources) {
            planet.raw.resources -= attrs.resources;
        }
        if (attrs.influence) {
            planet.raw.influence -= attrs.influence;
        }
        if (attrs.legendary) {
            // reset legendary status to initial state
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
        const index = planet.attachments.indexOf(this);
        if (index >= 0) {
            planet.attachments.splice(index, 1);
        }
    }
}

module.exports = { Attachment };
