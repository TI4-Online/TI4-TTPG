const assert = require("../../wrapper/assert-wrapper");
const {
    AbstractSystemAttachment,
} = require("../attachments/abstract-system-attachment");
const {
    refObject,
    GameObject,
    ObjectType,
    Vector,
} = require("../../wrapper/api");

class StellarConverter extends AbstractSystemAttachment {
    constructor(gameObject) {
        assert(gameObject instanceof GameObject);
        const isPlanetBased = true;
        const localeName = "token.exploration.stellar_converter";
        super(gameObject, isPlanetBased, localeName);
        this._attachLocaleMessage = "ui.message.stellar_converter"; // see super
        this.attachIfOnSystem();
    }

    place(system, planet, systemTileObj) {
        planet.destroyed = true;

        const attachmentPosition = systemTileObj
            .localPositionToWorld(planet.position)
            .add(new Vector(0, 0, systemTileObj.getSize().z));

        const tokenObj = this.getAttachTokenObj();
        tokenObj.setObjectType(ObjectType.Regular); // paranoia
        tokenObj.setPosition(attachmentPosition);
        tokenObj.setScale(systemTileObj.getScale());
        tokenObj.setObjectType(ObjectType.Ground); // ground i.e. locked
    }

    remove(system, planet, systemTileObj) {
        planet.destroyed = false;
    }
}

new StellarConverter(refObject);
