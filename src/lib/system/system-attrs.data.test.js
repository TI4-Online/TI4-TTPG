const assert = require("assert");
const locale = require("../locale");
const { SystemSchema } = require("./system.schema");
const SYSTEM_ATTRS = require("./system-attrs.data");

it("validate system table", () => {
    SYSTEM_ATTRS.forEach((systemAttrs) => {
        assert(SystemSchema.validate(systemAttrs));
    });
});

it("planet localeName", () => {
    SYSTEM_ATTRS.forEach((systemAttrs) => {
        if (systemAttrs.planets) {
            systemAttrs.planets.forEach((planet) => {
                const name = locale(planet.localeName);
                if (name === planet.localeName) {
                    console.log(name); // log to make it easier to check
                }
                assert(name !== planet.localeName);
            });
        }
    });
});
