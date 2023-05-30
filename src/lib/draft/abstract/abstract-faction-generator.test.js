require("../../../global"); // create world.TI4
const assert = require("assert");
const { MockCard, MockVector, world } = require("../../../wrapper/api");
const { AbstractFactionGenerator } = require("./abstract-faction-generator");

it("getOnTableFactionCards", () => {
    world.__clear();
    const nsids = [
        "card.faction_reference:base/jolnar",
        "card.faction_token:base/mentak",
        "card.faction_reference:codex.vigil/naalu.omega",
        "card.faction_reference:codex.vigil/naalu.omega", // dup
    ];
    for (const nsid of nsids) {
        const position = new MockVector(0, 0, world.getTableHeight());
        const card = MockCard.__create(nsid, position);
        world.__addObject(card);
    }

    const cards = AbstractFactionGenerator._getOnTableFactionCards();
    world.__clear();

    assert.equal(cards.length, 4); // includes duplicate!
});

it("getOnTableFactionCardNsidNames", () => {
    world.__clear();
    const nsids = [
        "card.faction_reference:base/jolnar",
        "card.faction_token:base/mentak",
        "card.faction_reference:codex.vigil/naalu.omega",
        "card.faction_reference:codex.vigil/naalu.omega", // dup
    ];
    for (const nsid of nsids) {
        const position = new MockVector(0, 0, world.getTableHeight());
        const card = MockCard.__create(nsid, position);
        world.__addObject(card);
    }

    const nsidNames =
        AbstractFactionGenerator._getOnTableFactionCardNsidNames();
    world.__clear();

    assert.deepEqual(nsidNames, ["jolnar", "mentak", "naalu"]);
});

it("standard generate", () => {
    const count = 10;
    const factionNsids = AbstractFactionGenerator._standardGenerate(count);
    assert.equal(factionNsids.length, count);
    for (const factionNsid of factionNsids) {
        assert(typeof factionNsid === "string");
    }
});

it("mix on table", () => {
    world.__clear();
    const nsids = [
        "card.faction_reference:base/jolnar",
        "card.faction_token:base/mentak",
        "card.faction_reference:codex.vigil/naalu.omega",
    ];
    for (const nsid of nsids) {
        const position = new MockVector(0, 0, world.getTableHeight());
        const card = MockCard.__create(nsid, position);
        world.__addObject(card);
    }

    const count = 10;
    const factionNsids = AbstractFactionGenerator._standardGenerate(
        count,
        true
    );
    world.__clear();

    const firstThree = factionNsids.slice(0, 3);
    firstThree.sort();

    assert.deepEqual(firstThree, ["jolnar", "mentak", "naalu"]);
});
