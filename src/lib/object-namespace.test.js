// the "it(string, function)" style works with mocha and jest frameworks
const { ObjectNamespace } = require("./object-namespace");
const assert = require("assert");
const {
    MockCard,
    MockCardDetails,
    MockGameObject,
} = require("../mock/mock-api");

it("cannot construct", () => {
    assert.throws(() => {
        new ObjectNamespace();
    });
});

it("parseNsid", () => {
    const id = "my.type:my.source/my.name";
    const result = ObjectNamespace.parseNsid(id);
    assert.equal(result.type, "my.type");
    assert.equal(result.source, "my.source");
    assert.equal(result.name, "my.name");
});

it("getNsid", () => {
    const id = "my.type:my.source/my.name";
    const obj = new MockGameObject({ templateMetadata: id });
    const result = ObjectNamespace.getNsid(obj);
    assert.equal(result, id);
});

it("getDeckNsids", () => {
    const ids = [
        "my.type:my.source/my.name.1",
        "my.type:my.source/my.name.2",
        "my.type:my.source/my.name.3",
    ];
    const allCardDetails = ids.map(
        (id) => new MockCardDetails({ metadata: id })
    );
    const deck = new MockCard({ allCardDetails, stackSize: ids.length });
    const result = ObjectNamespace.getDeckNsids(deck);
    assert.deepEqual(result, ids);
});

it("generic", () => {
    const id = "my.type:my.source/my.name";
    const obj = new MockGameObject({ templateMetadata: id });

    assert(ObjectNamespace.isGenericType(obj, "my.type"));
    assert(!ObjectNamespace.isGenericType(obj, "something.else"));

    const result = ObjectNamespace.parseGeneric(obj);
    assert.equal(result.type, "my.type");
    assert.equal(result.source, "my.source");
    assert.equal(result.name, "my.name");
});

it("card", () => {
    const id = "card.action:base/direct_hit.2";
    const obj = new MockCard({
        cardDetails: new MockCardDetails({ metadata: id }),
    });
    const not = new MockCard({ templateMetadata: "not:not/not" });

    const type = ObjectNamespace.getCardType("action");
    assert(ObjectNamespace.isGenericType(obj, type));
    assert(!ObjectNamespace.isGenericType(not, type));

    assert(ObjectNamespace.isCard(obj));
    assert(!ObjectNamespace.isCard(not));

    const result = ObjectNamespace.parseCard(obj);
    assert.equal(result.type, "card.action");
    assert.equal(result.source, "base");
    assert.equal(result.name, "direct_hit.2");
    assert.equal(result.deck, "action");
});

it("command token", () => {
    const id = "token.command:base/arborec";
    const obj = new MockGameObject({ templateMetadata: id });
    const not = new MockGameObject({ templateMetadata: "not:not/not" });

    assert(ObjectNamespace.isCommandToken(obj));
    assert(!ObjectNamespace.isCommandToken(not));

    const result = ObjectNamespace.parseCommandToken(obj);
    assert.equal(result.type, "token.command");
    assert.equal(result.source, "base");
    assert.equal(result.name, "arborec");
    assert.equal(result.faction, "arborec");
});

it("control token", () => {
    const id = "token.control:base/arborec";
    const obj = new MockGameObject({ templateMetadata: id });
    const not = new MockGameObject({ templateMetadata: "not:not/not" });

    assert(ObjectNamespace.isControlToken(obj));
    assert(!ObjectNamespace.isControlToken(not));

    const result = ObjectNamespace.parseControlToken(obj);
    assert.equal(result.type, "token.control");
    assert.equal(result.source, "base");
    assert.equal(result.name, "arborec");
    assert.equal(result.faction, "arborec");
});

it("strategy card", () => {
    const id = "tile.strategy:base/leadership.omega";
    const obj = new MockGameObject({ templateMetadata: id });
    const not = new MockGameObject({ templateMetadata: "not:not/not" });

    assert(ObjectNamespace.isStrategyCard(obj));
    assert(!ObjectNamespace.isStrategyCard(not));

    const result = ObjectNamespace.parseStrategyCard(obj);
    assert.equal(result.type, "tile.strategy");
    assert.equal(result.source, "base");
    assert.equal(result.name, "leadership.omega");
    assert.equal(result.card, "leadership");
});

it("system tile", () => {
    const id = "tile.system:base/18";
    const obj = new MockGameObject({ templateMetadata: id });
    const not = new MockGameObject({ templateMetadata: "not:not/not" });

    assert(ObjectNamespace.isSystemTile(obj));
    assert(!ObjectNamespace.isSystemTile(not));

    const result = ObjectNamespace.parseSystemTile(obj);
    assert.equal(result.type, "tile.system");
    assert.equal(result.source, "base");
    assert.equal(result.name, "18");
    assert.equal(result.tile, 18);
});

it("token", () => {
    const id = "token.vuilraith:pok/tear.nekro";
    const obj = new MockGameObject({ templateMetadata: id });
    const not = new MockGameObject({ templateMetadata: "not:not/not" });

    assert(ObjectNamespace.isToken(obj));
    assert(!ObjectNamespace.isToken(not));

    const result = ObjectNamespace.parseToken(obj);
    assert.equal(result.type, "token.vuilraith");
    assert.equal(result.source, "pok");
    assert.equal(result.name, "tear.nekro");
    assert.equal(result.token, "tear");
});

it("token bag", () => {
    const id = "bag.token:base/fighter_1";
    const obj = new MockGameObject({ templateMetadata: id });
    const not = new MockGameObject({ templateMetadata: "not:not/not" });

    assert(ObjectNamespace.isTokenBag(obj));
    assert(!ObjectNamespace.isTokenBag(not));

    const result = ObjectNamespace.parseTokenBag(obj);
    assert.equal(result.type, "bag.token");
    assert.equal(result.source, "base");
    assert.equal(result.name, "fighter_1");
    assert.equal(result.token, "fighter_1");
});

it("unit", () => {
    const id = "unit:base/dreadnought";
    const obj = new MockGameObject({ templateMetadata: id });
    const not = new MockGameObject({ templateMetadata: "not:not/not" });

    assert(ObjectNamespace.isUnit(obj));
    assert(!ObjectNamespace.isUnit(not));

    const result = ObjectNamespace.parseUnit(obj);
    assert.equal(result.type, "unit");
    assert.equal(result.source, "base");
    assert.equal(result.name, "dreadnought");
    assert.equal(result.unit, "dreadnought");
});

it("unit bag", () => {
    const id = "bag.unit:base/dreadnought";
    const obj = new MockGameObject({ templateMetadata: id });
    const not = new MockGameObject({ templateMetadata: "not:not/not" });

    assert(ObjectNamespace.isUnitBag(obj));
    assert(!ObjectNamespace.isUnitBag(not));

    const result = ObjectNamespace.parseUnitBag(obj);
    assert.equal(result.type, "bag.unit");
    assert.equal(result.source, "base");
    assert.equal(result.name, "dreadnought");
    assert.equal(result.unit, "dreadnought");
});
