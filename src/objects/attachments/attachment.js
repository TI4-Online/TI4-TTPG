const { getClosestPlanet } = require("../../lib/system/position-to-planet");
const { Facing } = require("../../lib/facing");
const { Broadcast } = require("../../lib/broadcast");
const { Planet } = require("../../lib/system/system");
const locale = require("../../lib/locale");
const assert = require("../../wrapper/assert-wrapper");
const {
    refPackageId,
    world,
    Card,
    GameObject,
    ImageWidget,
    ObjectType,
    Vector,
    UIElement,
} = require("../../wrapper/api");
const { Rotator } = require("@tabletop-playground/api");

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
        // Also applies when moved by script!
        this._obj.onMovementStopped.add(() => this.attach());

        if (world.getExecutionReason() === "ScriptReload") {
            this.attach();
        }
    }

    get attributes() {
        return this._attributes;
    }

    attach(planet = false, systemTileObj = false) {
        // is the attachment on a system tile?
        if (!systemTileObj) {
            systemTileObj = world.TI4.getSystemTileObjectByPosition(
                this._obj.getPosition()
            );
        }
        if (!systemTileObj) {
            return;
        }
        const system = world.TI4.getSystemBySystemTileObject(systemTileObj);
        if (!system || system.planets.length === 0) {
            return; // these attachments must have a planet
        }

        // attach to the given Planet or if no planet is given attach to the
        // nearest planet
        if (!planet) {
            planet = getClosestPlanet(this._obj.getPosition());
        }
        assert(planet instanceof Planet);

        // Abort if already attached to this planet (e.g. onMovementStopped repeated).
        if (
            this._systemTile === planet.system.tile &&
            this._planetName === planet.localeName
        ) {
            return;
        }

        // Detach before attaching to a new target.
        this.detach();

        this._systemTile = planet.system.tile;
        this._planetName = planet.localeName;

        const message = locale("ui.message.attach_token", {
            attachmentName: this._localeName,
            planetName: planet.getNameStr(),
        });
        Broadcast.chatAll(message);

        // update the planet attributes based on the attachment
        if (Facing.isFaceUp(this._obj) || !this._faceDown) {
            this._attachedFaceUp = true;
            this._attach(planet, this._faceUp);
        } else {
            this._attachedFaceUp = false;
            this._attach(planet, this._faceDown);
        }

        // Move and lock the attachment object to the proper location
        // Currently fits 3 comfortably.
        let numAttachments = planet.attachments.length;
        const steps = Math.floor((numAttachments - 1) / 3);
        if (steps % 2 === 1) {
            numAttachments += 0.5;
        }
        const phi = ((numAttachments - 1) * 120 * Math.PI) / 180;
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
        this._obj.setPosition(worldPosition);
        this._obj.setObjectType(ObjectType.Ground);

        // Add the attachment icon to the planet card
        const imagePath = this._attachedFaceUp
            ? this._faceUp.image
            : this._faceDown.image;
        for (const obj of world.getAllObjects()) {
            if (!(obj instanceof Card)) {
                continue;
            }
            const cardPlanet = world.TI4.getPlanetByCard(obj);
            if (cardPlanet !== planet) {
                continue;
            }
            if (imagePath) {
                this._attachImageToPlanetCard(obj, imagePath);
            }
        }

        return this;
    }

    _attach(planet, attrs) {
        planet.attachments.push(this);
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
    }

    _attachImageToPlanetCard(card, imagePath) {
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
        const index = planet.attachments.indexOf(this);
        if (index >= 0) {
            planet.attachments.splice(index, 1);
        }
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
    }
}

module.exports = { Attachment };
