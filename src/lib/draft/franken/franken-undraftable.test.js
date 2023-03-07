require("../../../global"); // register world.TI4
const assert = require("assert");
const { FrankenUndraftable } = require("./franken-undraftable");

it("getUndraftableNSIDs", () => {
    const undraftableNSIDs = FrankenUndraftable.getUndraftableNSIDs();
    assert(
        undraftableNSIDs.has(
            "card.promissory.mentak:base/promise_of_protection"
        )
    );
});
