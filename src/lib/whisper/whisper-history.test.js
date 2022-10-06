require("../../global"); // register world.TI4, etc
const assert = require("assert");
const { WhisperPair } = require("./whisper-history");
const { MockPlayer } = require("../../wrapper/api");

it("WhisperPair constructor", () => {
    const src = new MockPlayer({ slot: 1 });
    const dst = new MockPlayer({ slot: 2 });
    new WhisperPair(src, dst);
});

it("add/newestTimestamp", () => {
    const src = new MockPlayer({ slot: 1 });
    const dst = new MockPlayer({ slot: 2 });
    const pair = new WhisperPair(src, dst);
    const now = WhisperPair.timestamp();
    pair.add(src, dst, "foo");
    assert(Math.abs(pair.newestTimestamp() - now) < 0.01);
});

it("prune", () => {
    const src = new MockPlayer({ slot: 1 });
    const dst = new MockPlayer({ slot: 2 });
    const pair = new WhisperPair(src, dst);
    pair.add(src, dst, "foo");

    // Reach in and edit the timestamp.  Yuck.
    pair._history[0].timestamp = 1;

    // Timestamp is definitely older than history size.
    pair.prune();
    assert.equal(pair.newestTimestamp(), 0);
});

it("sort", () => {
    const src = new MockPlayer({ slot: 1 });
    const dst = new MockPlayer({ slot: 2 });
    const a = new WhisperPair(src, dst);
    const b = new WhisperPair(src, dst);
    a.add(src, dst, "foo", 1);
    b.add(src, dst, "foo", 1);

    let sorted = WhisperPair.sort([a, b]);
    assert.deepEqual(sorted, [a, b]);

    sorted = WhisperPair.sort([b, a]);
    assert.deepEqual(sorted, [a, b]);
});

it("_bucketize", () => {
    const src = new MockPlayer({ slot: 1 });
    const dst = new MockPlayer({ slot: 2 });
    const pair = new WhisperPair(src, dst);
    pair.add(src, dst, "foo");
    pair.add(dst, src, "bar");
    const buckets = pair._bucketize(2);
    assert.deepEqual(buckets, [[], [true, false]]);
});
