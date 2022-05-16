const assert = require("../../wrapper/assert-wrapper");
const {
    AbstractSystemAttachment,
} = require("../attachments/abstract-system-attachment");
const { refObject, GameObject } = require("../../wrapper/api");

class IonStorm extends AbstractSystemAttachment {
    constructor(gameObject) {
        assert(gameObject instanceof GameObject);
        const isPlanetBased = false;
        const localeName = "token.exploration.ion_storm";
        super(gameObject, isPlanetBased, localeName);
        this.attachIfOnSystem();
    }

    place(system, planet, systemTileObj, faceUp) {
        const wormhole = faceUp ? "alpha" : "beta";
        system.wormholes.push(wormhole);
    }

    remove(system, planet, systemTileObj, faceUp) {
        const wormhole = faceUp ? "alpha" : "beta";
        const index = system.wormholes.indexOf(wormhole);
        system.wormholes.splice(index, 1);
    }
}

new IonStorm(refObject);
