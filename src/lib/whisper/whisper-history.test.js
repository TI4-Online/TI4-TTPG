require("../../global"); // register world.TI4, etc
const assert = require("assert");
const { WhisperHistory, WhisperPair } = require("./whisper-history");
const {
    MockBorder,
    MockColor,
    MockPlayer,
    MockText,
    globalEvents,
    world,
} = require("../../wrapper/api");

it("WhisperPair constructor", () => {
    const desks = world.TI4.getAllPlayerDesks();
    const src = new MockPlayer({ slot: desks[0].playerSlot });
    const dst = new MockPlayer({ slot: desks[1].playerSlot });
    new WhisperPair(src, dst);
});

it("add/newestTimestamp", () => {
    const desks = world.TI4.getAllPlayerDesks();
    const src = new MockPlayer({ slot: desks[0].playerSlot });
    const dst = new MockPlayer({ slot: desks[1].playerSlot });
    const pair = new WhisperPair(src, dst);
    const now = WhisperPair.timestamp();
    pair.add(src, dst, "foo");
    assert(Math.abs(pair.newestTimestamp() - now) < 0.01);
});

it("prune", () => {
    const desks = world.TI4.getAllPlayerDesks();
    const src = new MockPlayer({ slot: desks[0].playerSlot });
    const dst = new MockPlayer({ slot: desks[1].playerSlot });
    const pair = new WhisperPair(src, dst);
    pair.add(src, dst, "foo");

    // Reach in and edit the timestamp.  Yuck.
    pair._history[0].timestamp = 1;

    // Timestamp is definitely older than history size.
    assert.equal(pair._history.length, 1);
    pair.prune();
    assert.equal(pair._history.length, 0);
});

it("sort", () => {
    const desks = world.TI4.getAllPlayerDesks();
    const src = new MockPlayer({ slot: desks[0].playerSlot });
    const dst = new MockPlayer({ slot: desks[1].playerSlot });
    const a = new WhisperPair(src, dst);
    const b = new WhisperPair(src, dst);
    const c = new WhisperPair(src, dst);
    a.add(src, dst, "foo", 2);
    b.add(src, dst, "foo", 1);
    c.add(src, dst, "foo", 3); // NEWEST!

    let sorted = WhisperPair.sort([a, b, c]);
    assert.deepEqual(sorted, [c, a, b]);

    sorted = WhisperPair.sort([c, b, a]);
    assert.deepEqual(sorted, [c, a, b]);
});

it("_bucketize", () => {
    const desks = world.TI4.getAllPlayerDesks();
    const src = new MockPlayer({ slot: desks[0].playerSlot });
    const dst = new MockPlayer({ slot: desks[1].playerSlot });
    const pair = new WhisperPair(src, dst);
    pair.add(src, dst, "foo");
    pair.add(dst, src, "bar"); // new first entry
    const buckets = pair._bucketize(2);
    assert.deepEqual(buckets, [[false, true], []]);
});

it("summarizeToBorders", () => {
    const desks = world.TI4.getAllPlayerDesks();
    const src = new MockPlayer({ slot: desks[0].playerSlot });
    const dst = new MockPlayer({ slot: desks[1].playerSlot });
    const pair = new WhisperPair(src, dst);
    pair.add(src, dst, "foo");
    pair.add(dst, src, "bar");
    const labelA = new MockText();
    const labelB = new MockText();
    const borders = [new MockBorder(), new MockBorder()];
    const black = new MockColor();
    pair.summarizeToBorders(labelA, labelB, borders, black);
    // For now just check it runs
});

it("onWhisper", () => {
    // In the mock environment, we can trigger whispers.
    const desks = world.TI4.getAllPlayerDesks();
    const src = new MockPlayer({ slot: desks[0].playerSlot });
    const dst = new MockPlayer({ slot: desks[1].playerSlot });
    globalEvents.onWhisper.trigger(src, dst, "foo");

    const pair = WhisperPair.findOrCreate(src, dst);
    const now = WhisperPair.timestamp();
    assert(Math.abs(pair.newestTimestamp() - now) < 0.01);
});

it("getAllInUpdateOrder", () => {
    // In the mock environment, we can trigger whispers.
    const desks = world.TI4.getAllPlayerDesks();
    const a = new MockPlayer({ slot: desks[0].playerSlot });
    const b = new MockPlayer({ slot: desks[1].playerSlot });
    const c = new MockPlayer({ slot: desks[2].playerSlot });
    globalEvents.onWhisper.trigger(a, b, "foo");
    globalEvents.onWhisper.trigger(c, a, "foo");

    const whisperPairs = WhisperHistory.getAllInUpdateOrder();
    assert(Array.isArray(whisperPairs));
    assert.equal(whisperPairs.length, 2);
    assert.equal(whisperPairs[0]._playerSlotA, desks[0].playerSlot);
    assert.equal(whisperPairs[0]._playerSlotB, desks[1].playerSlot);
    assert.equal(whisperPairs[1]._playerSlotA, desks[2].playerSlot);
    assert.equal(whisperPairs[1]._playerSlotB, desks[0].playerSlot);
});
