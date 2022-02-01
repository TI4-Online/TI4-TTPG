const assert = require("assert");
const { SystemSchema } = require("./system.schema");
const SYSTEM_ATTRS = require("./system-attrs.data");

it("validate system table", () => {
    let validCount = 0;
    SYSTEM_ATTRS.forEach((element) => {
        if (SystemSchema.validate(element)) {
            validCount++;
        }
    });
    assert(validCount === SYSTEM_ATTRS.length);
});
