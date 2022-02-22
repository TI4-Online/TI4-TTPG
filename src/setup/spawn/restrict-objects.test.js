require("../../global"); // setup world.TI4
const assert = require("assert");
const { RestrictObjects } = require("./restrict-objects");
const { MockGameObject, world } = require("../../wrapper/api");

it("pok", () => {
    world.__clear();
    const obj = new MockGameObject({ templateMetadata: "x:pok/x" });
    world.__addObject(obj);
    assert(obj.isValid());

    world.TI4.config.setPoK(true);
    RestrictObjects.removeRestrictObjects();
    assert(obj.isValid());

    world.TI4.config.setPoK(false);
    RestrictObjects.removeRestrictObjects();
    assert(!obj.isValid());

    world.__clear();
});

it("base.only", () => {
    world.__clear();
    const obj = new MockGameObject({ templateMetadata: "x:base.only/x" });
    world.__addObject(obj);
    assert(obj.isValid());

    world.TI4.config.setPoK(false);
    RestrictObjects.removeRestrictObjects();
    assert(obj.isValid());

    world.TI4.config.setPoK(true);
    RestrictObjects.removeRestrictObjects();
    assert(!obj.isValid());

    world.__clear();
});

it("codex.ordinian", () => {
    world.__clear();
    const obj = new MockGameObject({ templateMetadata: "x:codex.ordinian/x" });
    world.__addObject(obj);
    assert(obj.isValid());

    world.TI4.config.setCodex1(true);
    RestrictObjects.removeRestrictObjects();
    assert(obj.isValid());

    world.TI4.config.setCodex1(false);
    RestrictObjects.removeRestrictObjects();
    assert(!obj.isValid());

    world.__clear();
});

it("codex.affinity", () => {
    world.__clear();
    const obj = new MockGameObject({ templateMetadata: "x:codex.affinity/x" });
    world.__addObject(obj);
    assert(obj.isValid());

    world.TI4.config.setCodex2(true);
    RestrictObjects.removeRestrictObjects();
    assert(obj.isValid());

    world.TI4.config.setCodex2(false);
    RestrictObjects.removeRestrictObjects();
    assert(!obj.isValid());

    world.__clear();
});
