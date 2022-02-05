const { REJECT_REASON, getRejectReason } = require("./patch-exclusive-bags");
const { MockGameObject } = require("../mock/mock-api");
const assert = require("assert");

it("can accept", () => {
    const bag = new MockGameObject({
        templateMetadata: "bag.unit:base/fighter",
        owningPlayerSlot: 7,
    });
    const inserted = new MockGameObject({
        templateMetadata: "unit:base/fighter",
        owningPlayerSlot: 7,
    });
    assert.equal(getRejectReason(bag, inserted), false);
});

it("malformed bag", () => {
    const bag = new MockGameObject({
        templateMetadata: "abc",
        owningPlayerSlot: 7,
    });
    const inserted = new MockGameObject({
        templateMetadata: "unit:base/fighter",
        owningPlayerSlot: 7,
    });
    assert.equal(getRejectReason(bag, inserted), REJECT_REASON.BAG_PARSE);
});

it("malformed inserted", () => {
    const bag = new MockGameObject({
        templateMetadata: "bag.unit:base/fighter",
        owningPlayerSlot: 7,
    });
    const inserted = new MockGameObject({
        templateMetadata: "abc",
        owningPlayerSlot: 7,
    });
    assert.equal(getRejectReason(bag, inserted), REJECT_REASON.INSERTED_PARSE);
});

it("mismatch owner", () => {
    const bag = new MockGameObject({
        templateMetadata: "bag.unit:base/fighter",
        owningPlayerSlot: 7,
    });
    const inserted = new MockGameObject({
        templateMetadata: "unit:base/fighter",
        owningPlayerSlot: 8,
    });
    assert.equal(getRejectReason(bag, inserted), REJECT_REASON.MISMATCH_OWNER);
});

it("mismatch type", () => {
    const bag = new MockGameObject({
        templateMetadata: "bag.token:base/fighter_1",
        owningPlayerSlot: 7,
    });
    const inserted = new MockGameObject({
        templateMetadata: "unit:base/infantry",
        owningPlayerSlot: 7,
    });
    assert.equal(getRejectReason(bag, inserted), REJECT_REASON.MISMATCH_TYPE);
});

it("mismatch name", () => {
    const bag = new MockGameObject({
        templateMetadata: "bag.unit:base/fighter",
        owningPlayerSlot: 7,
    });
    const inserted = new MockGameObject({
        templateMetadata: "unit:base/infantry",
        owningPlayerSlot: 7,
    });
    assert.equal(getRejectReason(bag, inserted), REJECT_REASON.MISMATCH_NAME);
});
