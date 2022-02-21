const { world, Vector, GameObject } = require("../../wrapper/api");
const { getClosestPlanet } = require("../../lib/system/position-to-planet");
const { Facing } = require("../../lib/facing");
const { Broadcast } = require("../../lib/broadcast");
const { Planet } = require("../../lib/system/system");
const locale = require("../../lib/locale");
const assert = require("../../wrapper/assert-wrapper");

class Attachment {
    constructor(gameObject, attributes) {
        assert(gameObject instanceof GameObject);

        this._obj = gameObject;
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
    }

    attach(inputPlanet) {
        // attach to the given Planet or if no planet is given attach to the
        // nearest planet
        if (inputPlanet) {
            assert(inputPlanet instanceof Planet);
        }
        const planet = inputPlanet || getClosestPlanet(this._obj.getPosition());
        if (!planet) {
            return;
        }

        this.detach();

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

        // move and lock the attachment object to the proper location
        const systemObject = world.TI4.getSystemTileObjectByPosition(
            this._obj.getPosition()
        );
        const attachmentPosition = new Vector(
            planet.position.x - 0.5,
            planet.position.y - 0.5,
            systemObject.getSize().z
        );
        const worldPosition =
            systemObject.localPositionToWorld(attachmentPosition);
        this._obj.setPosition(worldPosition);
        this._obj.setScale(systemObject.getScale());
        this._obj.setObjectType(1); // ground i.e. locked

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
    }
}

module.exports = { Attachment };
