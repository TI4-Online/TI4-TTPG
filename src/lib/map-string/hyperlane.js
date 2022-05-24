const assert = require("../../wrapper/assert-wrapper");

const HYPERLANES = {
    3: "{-1} 85A3 -1 85A5 -1 85A1 -1 -1 87A3 -1 88A5 -1 87A5 -1 87A3 -1 88A5 -1 88A3 86A3 84A3 -1 -1 -1 83A2 86A5 84A5 -1 -1 -1 84A3 86A1 83A2 -1 -1 -1 83A0",
    4: "{-1} 85A3 -1 -1 85A0 -1 -1 -1 88A1 -1 -1 -1 88A0 -1 87A0 -1 -1 -1 87A5 86A3 83A1 -1 -1 -1 -1 -1 -1 83A0 86A0 84A3 -1 -1 -1 -1 -1 -1 84A5",
    5: "{-1} -1 -1 -1 85A0 -1 -1 -1 -1 -1 -1 -1 88A0 -1 87A0 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 83A0 86A0 84A3",
    7: "{-1} 85B3 -1 -1 84B3 90B0 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 88B3 -1 -1 -1 -1 -1 -1 86B3 -1 -1 -1 -1 -1 83B2",
    8: "{-1} 87A1 90B3 -1 88A2 89B0 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 -1 85B2 -1 -1 -1 -1 -1 -1 -1 -1 83B2",
};

class Hyperlane {
    constructor() {
        throw new Error("static only");
    }

    static getMapString(playerCount) {
        assert(typeof playerCount === "number");
        return HYPERLANES[playerCount];
    }
}

module.exports = { Hyperlane };
