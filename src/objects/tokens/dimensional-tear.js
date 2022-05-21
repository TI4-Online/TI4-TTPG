const assert = require("../../wrapper/assert-wrapper");
const {
    AbstractSystemAttachment,
} = require("../attachments/abstract-system-attachment");
const { refObject, GameObject } = require("../../wrapper/api");

class DimensionalTear extends AbstractSystemAttachment {
    constructor(gameObject) {
        assert(gameObject instanceof GameObject);
        const isPlanetBased = false; // it usually is, but nekro with floating factory 2?
        const localeName = "token.dimensional_tear";
        super(gameObject, isPlanetBased, localeName);
        this.attachIfOnSystem();
    }

    place(system, planet, systemTileObj) {
        system.anomalies.push("gravity rift");
    }

    remove(system, planet, systemTileObj) {
        const index = system.anomalies.indexOf("gravity rift");
        system.anomalies.splice(index, 1);
    }
}

new DimensionalTear(refObject);
