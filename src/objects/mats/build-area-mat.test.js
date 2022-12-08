require("../../global"); // register world.TI4
const assert = require("assert");
const { BuildAreaMat, TYPE } = require("./build-area-mat");
const {
    MockCard,
    MockGameObject,
    MockVector,
    world,
} = require("../../wrapper/api");

it("constructor", () => {
    const obj = new MockGameObject();
    const buildAreaMat = new BuildAreaMat(obj);
    assert(buildAreaMat);
});

it("getConsumeFlags", () => {
    world.__clear();

    // No flags for empty table.
    let flags = BuildAreaMat.getConsumeFlags(0);
    assert(!flags.hasXxchaHeroCodex3);
    assert(!flags.hasMirrorComputing);

    // Give one desk cards.
    const desk = world.TI4.getAllPlayerDesks()[0];
    const pos = desk.center;
    const playerSlot = desk.playerSlot;

    let nsid = "card.leader.hero.xxcha:codex.vigil/xxekir_grom.omega";
    const xxchaHero = MockCard.__create(nsid, pos);
    world.__addObject(xxchaHero);

    nsid = "card.technology.yellow.mentak:base/mirror_computing";
    const mirrorComputing = MockCard.__create(nsid, pos);
    world.__addObject(mirrorComputing);

    // Desk should have flags.
    flags = BuildAreaMat.getConsumeFlags(playerSlot);
    assert(flags.hasXxchaHeroCodex3);
    assert(flags.hasMirrorComputing);

    // Different desk does not have flags.
    flags = BuildAreaMat.getConsumeFlags(playerSlot + 1);
    assert(!flags.hasXxchaHeroCodex3);
    assert(!flags.hasMirrorComputing);

    world.__clear();
});

it("getConsumeEntries", () => {
    const pos = new MockVector(0, 0, 0);
    const flags = {};

    let nsid = "token:base/tradegood_commodity_1";
    let obj = MockGameObject.__create(nsid, pos);
    let consumeEntries = BuildAreaMat.getConsumeEntries(obj, flags);
    assert.equal(consumeEntries.length, 1);
    let consumeEntry = consumeEntries[0];
    assert.equal(consumeEntry.obj, obj);
    assert.equal(consumeEntry.type, TYPE.TRADEGOOD);
    assert.equal(consumeEntry.value, 1);
    assert.equal(consumeEntry.count, 1);

    nsid = "token:base/tradegood_commodity_3";
    obj = MockGameObject.__create(nsid, pos);
    consumeEntries = BuildAreaMat.getConsumeEntries(obj, flags);
    assert.equal(consumeEntries.length, 1);
    consumeEntry = consumeEntries[0];
    assert.equal(consumeEntry.obj, obj);
    assert.equal(consumeEntry.type, TYPE.TRADEGOOD);
    assert.equal(consumeEntry.value, 3);
    assert.equal(consumeEntry.count, 1);

    nsid = "card.planet:base/mecatol_rex";
    obj = MockCard.__create(nsid, pos);
    consumeEntries = BuildAreaMat.getConsumeEntries(obj, flags);
    assert.equal(consumeEntries.length, 1);
    consumeEntry = consumeEntries[0];
    assert.equal(consumeEntry.obj, obj);
    assert.equal(consumeEntry.obj, obj);
    assert.equal(consumeEntry.type, TYPE.PLANET);
    assert.equal(consumeEntry.name, "Mecatol Rex");
    assert.equal(consumeEntry.value, 1);
    assert.equal(consumeEntry.count, 1);
});

it("xxcha hero codex 3", () => {
    world.__clear();

    const desk = world.TI4.getAllPlayerDesks()[0];
    const pos = desk.center;
    const playerSlot = desk.playerSlot;

    let nsid = "card.leader.hero.xxcha:codex.vigil/xxekir_grom.omega";
    const xxchaHero = MockCard.__create(nsid, pos);
    world.__addObject(xxchaHero);
    const flags = BuildAreaMat.getConsumeFlags(playerSlot);

    nsid = "card.planet:base/mecatol_rex";
    const obj = MockCard.__create(nsid, pos);
    const consumeEntries = BuildAreaMat.getConsumeEntries(obj, flags);
    world.__clear();

    assert.equal(consumeEntries.length, 1);
    const consumeEntry = consumeEntries[0];
    assert.equal(consumeEntry.obj, obj);
    assert.equal(consumeEntry.obj, obj);
    assert.equal(consumeEntry.type, TYPE.PLANET);
    assert.equal(consumeEntry.name, "Mecatol Rex");
    assert.equal(consumeEntry.value, 7);
    assert.equal(consumeEntry.count, 1);
});

it("mirror computing", () => {
    world.__clear();

    const desk = world.TI4.getAllPlayerDesks()[0];
    const pos = desk.center;
    const playerSlot = desk.playerSlot;

    let nsid = "card.technology.yellow.mentak:base/mirror_computing";
    const xxchaHero = MockCard.__create(nsid, pos);
    world.__addObject(xxchaHero);
    const flags = BuildAreaMat.getConsumeFlags(playerSlot);

    nsid = "token:base/tradegood_commodity_3";
    const obj = MockGameObject.__create(nsid, pos);
    const consumeEntries = BuildAreaMat.getConsumeEntries(obj, flags);
    world.__clear();

    assert.equal(consumeEntries.length, 1);
    const consumeEntry = consumeEntries[0];
    assert.equal(consumeEntry.obj, obj);
    assert.equal(consumeEntry.type, TYPE.TRADEGOOD);
    assert.equal(consumeEntry.value, 6);
    assert.equal(consumeEntry.count, 1);
});
