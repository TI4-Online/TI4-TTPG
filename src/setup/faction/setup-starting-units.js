const { AbstractSetup } = require("../abstract-setup");
const { ObjectNamespace } = require("../../lib/object-namespace");

class SetupStartingUnits extends AbstractSetup {
    constructor(playerDesk, faction) {
        super(playerDesk, faction);
    }

    setup() {}

    clean() {}
}

module.exports = { SetupStartingUnits };
