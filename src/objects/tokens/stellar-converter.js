const assert = require("../../wrapper/assert-wrapper");
const {
    AbstractSystemAttachment,
} = require("../attachments/abstract-system-attachment");
const { Explore } = require("../../lib/explore/explore");
const { refObject, GameObject } = require("../../wrapper/api");

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
        console.log(
            `StellarConvert.place ${system.tile} ${planet.getNameStr()}`
        );
        planet.destroyed = true;

        const attachmentPosition = systemTileObj
            .localPositionToWorld(planet.position)
            .add([0, 0, systemTileObj.getSize().z]);

        const tokenObj = this.getAttachTokenObj();

        const p = tokenObj.getPosition();
        const dx = p.x - attachmentPosition.x;
        const dy = p.y - attachmentPosition.y;
        const dSq = dx * dx + dy * dy;
        if (dSq < 0.1) {
            return;
        }

        tokenObj.setScale(systemTileObj.getScale());

        const rot = tokenObj.getRotation();
        Explore.reserveTokenSpaceAndAnchorToken(
            tokenObj,
            attachmentPosition,
            rot
        );
    }

    remove(system, planet, systemTileObj) {
        planet.destroyed = false;
    }
}

new StellarConverter(refObject);
