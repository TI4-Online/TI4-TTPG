require("../../global"); // define world.TI4
const assert = require("assert");
const locale = require("../../lib/locale");
const { Spawn } = require("./spawn");

it("static getAllNSIDs", () => {
    const nsids = Spawn.getAllNSIDs();
    assert(nsids.length > 0);
});

it("static getGroupName", () => {
    const groupName = Spawn.getGroupName(
        "card.technology.blue.creuss:base/..."
    );
    assert.equal(groupName, "card.technology");
});

it("static groupNSIDs", () => {
    const nsids = Spawn.getAllNSIDs();
    const typeToNsids = Spawn.groupNSIDs(nsids);
    assert(Object.keys(typeToNsids).length > 0);
});

it("static suggestName deck", () => {
    const name = Spawn.suggestName("card.action:base/whatever");
    assert.equal(name, locale("deck.action"));
    assert(name !== "deck.action"); // locale has the translation
});

it("static suggestName strategy cards", () => {
    const nsidToName = {
        "tile.strategy:base/construction": "Construction",
        "tile.strategy:base/construction.errata": "Construction",
        "tile.strategy:base/diplomacy": "Diplomacy",
        "tile.strategy:base/diplomacy.errata": "Diplomacy",
        "tile.strategy:base/imperial": "Imperial",
        "tile.strategy:base/leadership": "Leadership",
        "tile.strategy:base/politics": "Politics",
        "tile.strategy:base/technology": "Technology",
        "tile.strategy:base/trade": "Trade",
        "tile.strategy:base/warfare": "Warfare",
    };
    for (const [nsid, name] of Object.entries(nsidToName)) {
        const suggestedName = Spawn.suggestName(nsid);
        assert.equal(suggestedName, name);
    }
});

it("static suggestName command token", () => {
    const name = Spawn.suggestName("token.command:base/arborec");
    const abbr = locale("faction.abbr.arborec");
    const cmp = locale("token.command", { faction: abbr });
    assert.equal(name, cmp);
});

it("static suggestName control token", () => {
    const name = Spawn.suggestName("token.control:base/arborec");
    const abbr = locale("faction.abbr.arborec");
    const cmp = locale("token.control", { faction: abbr });
    assert.equal(name, cmp);
});
