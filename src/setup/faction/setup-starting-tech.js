const { AbstractSetup } = require("../abstract-setup");
const { ObjectNamespace } = require("../../lib/object-namespace");

class SetupStartingTech extends AbstractSetup {
    constructor(playerDesk, faction) {
        super(playerDesk, faction);
    }

    setup() {}

    clean() {}
}

module.exports = { SetupStartingTech };
