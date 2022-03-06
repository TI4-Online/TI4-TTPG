const assert = require("../../wrapper/assert-wrapper");
const {
    AbstractSystemAttachment,
} = require("../attachments/abstract-system-attachment");
const { refObject, GameObject } = require("../../wrapper/api");

class GammaWormhole extends AbstractSystemAttachment {
    constructor(gameObject) {
        assert(gameObject instanceof GameObject);
        const isPlanetBased = false;
        const localeName = "token.wormhole.gamma";
        super(gameObject, isPlanetBased, localeName);
        this.attachIfOnSystem();
    }

    place(system, planet, systemTileObj) {
        system.wormholes.push("gamma");
    }

    remove(system, planet, systemTileObj) {
        const index = system.wormholes.indexOf("gamma");
        system.wormholes.splice(index, 1);
    }
}

new GammaWormhole(refObject);
