const assert = require("../../wrapper/assert-wrapper");
const { Player, globalEvents } = require("../../wrapper/api");

const WINDOW_SIZE_SECONDS = 10 * 60;

class WhisperPair {
    static timestamp() {
        return Date.now() / 1000.0;
    }

    static generateKey(src, dst) {
        assert(src instanceof Player);
        assert(dst instanceof Player);

        let a = src.getSlot();
        let b = dst.getSlot();
        if (a > b) {
            [a, b] = [b, a];
        }
        return `<${a},${b}>`;
    }

    static sort(whisperPairs) {
        assert(Array.isArray(whisperPairs));
        return whisperPairs.sort(
            (a, b) => a.newestTimestamp() - b.newestTimestamp()
        );
    }

    constructor(playerA, playerB) {
        assert(playerA instanceof Player);
        assert(playerB instanceof Player);

        this._playerSlotA = playerA.getSlot();
        this._playerSlotB = playerB.getSlot();
        this._history = [];
    }

    prune() {
        const now = WhisperPair.timestamp();
        const limit = now - WINDOW_SIZE_SECONDS;
        while (this._history.length > 0) {
            const peek = this._history[0];
            if (peek.timestamp < limit) {
                this._history.shift();
            }
        }
    }

    add(src, dst, msg) {
        assert(src instanceof Player);
        assert(dst instanceof Player);
        assert(typeof msg === "string");

        const srcSlot = src.getSlot();
        const dstSlot = dst.getSlot();

        assert(srcSlot === this._playerSlotA || srcSlot === this._playerSlotB);
        assert(dstSlot === this._playerSlotA || dstSlot === this._playerSlotB);

        const forward = srcSlot === this._playerSlotA; // src->dst or dst->src
        this._history.push({
            timestamp: WhisperPair.timestamp(),
            forward,
        });
    }

    newestTimestamp() {
        const last = this._history[this._history.length - 1];
        return last ? last.timestamp : 0;
    }

    /**
     * Represent forward and reverse messages (preserving order) in buckets.
     * Buckets are in time order, the last bucket being newest.
     *
     * @param {number} numBuckets
     * @return {Array.{boolean}}
     */
    _bucketize(numBuckets) {
        assert(typeof numBuckets === "number");
        assert(numBuckets > 0);

        const buckets = new Array(numBuckets).fill(0).map((x) => []);

        const now = WhisperPair.timestamp();
        for (const entry of this._history) {
            assert(typeof entry.timestamp === "number");
            const age = now - entry.timestamp;
            if (age > WINDOW_SIZE_SECONDS || age < 0) {
                continue;
            }
            const bucketIndex =
                buckets.length -
                1 -
                Math.round((age * (buckets.length - 1)) / WINDOW_SIZE_SECONDS);
            const bucket = buckets[bucketIndex];
            assert(bucket);
            assert(typeof entry.forward === "boolean");
            bucket.push(entry.forward);
        }
        return buckets;
    }

    summarize(strLen) {
        assert(typeof strLen === "number");
        assert(strLen > 0);

        const str = new Array(strLen)
            .fill(0)
            .map((x) => [" "])
            .join();
    }
}

globalEvents.onWhisper.add((src, dst, msg) => {
    assert(src instanceof Player);
    assert(dst instanceof Player);
    assert(typeof msg === "string");

    // XXX TODO
    console.log("XXX");
});

module.exports = { WhisperPair };
