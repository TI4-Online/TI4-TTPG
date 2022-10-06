const assert = require("../../wrapper/assert-wrapper");
const { Border, Player, globalEvents } = require("../../wrapper/api");

const WINDOW_SIZE_SECONDS = 10 * 60;

const _keyToWhisperPair = {};

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
            // Newer entries at front of list.
            (a, b) => a.newestTimestamp() - b.newestTimestamp()
        );
    }

    static findOrCreate(src, dst) {
        assert(src instanceof Player);
        assert(dst instanceof Player);
        const key = WhisperPair.generateKey(src, dst);
        let whisperPair = _keyToWhisperPair[key];
        if (!whisperPair) {
            whisperPair = new WhisperPair(src, dst);
            _keyToWhisperPair[key] = whisperPair;
        }
        assert(whisperPair instanceof WhisperPair);
        return whisperPair;
    }

    constructor(playerA, playerB) {
        assert(playerA instanceof Player);
        assert(playerB instanceof Player);

        this._playerSlotA = playerA.getSlot();
        this._playerSlotB = playerB.getSlot();
        this._history = [];
        this._lastAddTimestamp = 0; // preserve value even after prune
    }

    prune() {
        const now = WhisperPair.timestamp();
        const limit = now - WINDOW_SIZE_SECONDS;
        while (this._history.length > 0 && this._history[0].timestamp < limit) {
            this._history.shift();
        }
        return this;
    }

    add(src, dst, msg) {
        assert(src instanceof Player);
        assert(dst instanceof Player);
        assert(typeof msg === "string");

        const srcSlot = src.getSlot();
        const dstSlot = dst.getSlot();

        assert(srcSlot === this._playerSlotA || srcSlot === this._playerSlotB);
        assert(dstSlot === this._playerSlotA || dstSlot === this._playerSlotB);

        const timestamp = WhisperPair.timestamp();
        const forward = srcSlot === this._playerSlotA; // src->dst or dst->src
        const entry = {
            timestamp,
            forward,
        };

        assert(Array.isArray(this._history));
        this._history.push(entry);
        this._lastAddTimestamp = timestamp;
        return this;
    }

    newestTimestamp() {
        return this._lastAddTimestamp;
    }

    /**
     * Represent forward and reverse messages (preserving order) in buckets.
     * Buckets are in reverse time order, the first bucket being newest.
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
            const bucketIndex = Math.round(
                (age * (buckets.length - 1)) / WINDOW_SIZE_SECONDS
            );
            const bucket = buckets[bucketIndex];
            assert(bucket);
            assert(typeof entry.forward === "boolean");
            bucket.push(entry.forward);
        }
        return buckets;
    }

    /**
     * Set Border colors to summarize communications.
     * Apply color per cell, extend to neighboring cells even if not same time bucket.
     *
     * @param {Array.{Border}} arrayOfBorders
     */
    summarizeToBorders(arrayOfBorders) {
        assert(Array.isArray(arrayOfBorders));
        arrayOfBorders.forEach((border) => {
            assert(border instanceof Border);
        });

        const black = [0, 0, 0, 1];
        const src = [1, 0, 0, 1];
        const dst = [0, 1, 0, 1];

        arrayOfBorders.forEach((border) => {
            border.setColor(black);
        });

        const buckets = this._bucketize(arrayOfBorders.length);
        let nextBucketIndex = 0;
        buckets.forEach((bucket, index) => {
            // Start at the later of [correct bucket] or [next available bucket],
            // draw communication exchanges in order and run past time window allotment.
            nextBucketIndex = Math.max(nextBucketIndex, index);
            bucket.forEach((forward) => {
                const border = arrayOfBorders[nextBucketIndex++];
                if (!border) {
                    return; // ran past end
                }
                border.setColor(forward ? src : dst);
            });
        });
    }
}

class WhisperHistory {
    constructor() {
        throw new Error("static only");
    }

    static getAllInUpdateOrder() {
        const whisperPairs = Object.values(_keyToWhisperPair);
        whisperPairs.forEach((whisperPair) => {
            whisperPair.prune();
        });
        return WhisperPair.sort(whisperPairs);
    }
}

globalEvents.onWhisper.add((src, dst, msg) => {
    assert(src instanceof Player);
    assert(dst instanceof Player);
    assert(typeof msg === "string");

    WhisperPair.findOrCreate(src, dst)
        .prune() // trim old
        .add(src, dst, msg);
});

module.exports = { WhisperHistory, WhisperPair };
