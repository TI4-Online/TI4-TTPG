const assert = require("assert");
const { FactionAliases } = require("./faction-aliases");

it("matches nsid", () => {
    const result = FactionAliases.getNsid("arborec");
    assert.equal(result, "arborec");
});

it("matches nsid capitalized", () => {
    const result = FactionAliases.getNsid("Arborec");
    assert.equal(result, "arborec");
});

it("alias", () => {
    const result = FactionAliases.getNsid("Jol-Nar");
    assert.equal(result, "jolnar");
});
