const assert = require("../wrapper/assert");
const { System } = require("../lib/system/system");
const { GameObject } = require("../wrapper/api");

class AutoRollerUI {
    constructor(gameObject) {
        assert(gameObject instanceof GameObject);
    }

    setAwaitingSystemActivation() {}

    setAfterSystemActivation(system) {
        assert(system instanceof System);
    }
}

module.exports = { AutoRollerUI };
