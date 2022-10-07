const assert = require("../../wrapper/assert-wrapper");
const {
    Border,
    Player,
    Text,
    globalEvents,
    world,
} = require("../../wrapper/api");

const WINDOW_SIZE_SECONDS = 10 * 60;

const _keyToWhisperPair = {};

class WhisperPair {
    static timestamp() {
        return Date.now() / 1000.0;
    }

    static generateKey(src, dst) {
        assert(src instanceof Player);
        assert(dst instanceof Player);

        const deskA = world.TI4.getPlayerDeskByPlayerSlot(src.getSlot());
        const deskB = world.TI4.getPlayerDeskByPlayerSlot(dst.getSlot());
        if (!deskA || !deskB) {
            return undefined; // require both endpoints be seated
        }

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
        if (!key) {
            return undefined;
        }
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
     * Entries in buckets are also reverse order, first is newest.
     *
     * @param {number} numBuckets
     * @return {Array.{boolean}}
     */
    _bucketize(numBuckets) {
        assert(typeof numBuckets === "number");
        assert(numBuckets > 0);

        const buckets = new Array(numBuckets).fill(0).map((x) => []);
        const bucketDuration = WINDOW_SIZE_SECONDS / buckets.length;

        const now = WhisperPair.timestamp();
        for (const entry of this._history) {
            assert(typeof entry.timestamp === "number");
            let age = now - entry.timestamp;
            if (age > WINDOW_SIZE_SECONDS || age < 0) {
                continue;
            }

            // Discretize age so buckets shift at the same time.
            age = Math.floor(age / bucketDuration) * bucketDuration;

            const bucketIndex = Math.floor(
                (age * (buckets.length - 1)) / WINDOW_SIZE_SECONDS
            );
            const bucket = buckets[bucketIndex];
            assert(bucket);
            assert(typeof entry.forward === "boolean");
            bucket.unshift(entry.forward);
        }
        return buckets;
    }

    /**
     * Set Border colors to summarize communications.
     * Apply color per cell, extend to neighboring cells even if not same time bucket.
     *
     * @param {Array.{Border}} arrayOfBorders
     */
    summarizeToBorders(labelA, labelB, arrayOfBorders, black) {
        assert(labelA instanceof Text);
        assert(labelB instanceof Text);
        assert(Array.isArray(arrayOfBorders));
        arrayOfBorders.forEach((border) => {
            assert(border instanceof Border);
        });
        assert(black);

        const deskA = world.TI4.getPlayerDeskByPlayerSlot(this._playerSlotA);
        const deskB = world.TI4.getPlayerDeskByPlayerSlot(this._playerSlotB);
        const nameA = deskA ? deskA.colorName : "?";
        const nameB = deskB ? deskB.colorName : "?";
        const colorA = deskA ? deskA.plasticColor : [1, 1, 1, 1];
        const colorB = deskB ? deskB.plasticColor : [1, 1, 1, 1];

        labelA.setText(nameA);
        labelA.setTextColor(colorA);
        labelB.setText(nameB);
        labelB.setTextColor(colorB);

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
                border.setColor(forward ? colorA : colorB);
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

    const whisperPair = WhisperPair.findOrCreate(src, dst);
    if (whisperPair) {
        whisperPair
            .prune() // trim old
            .add(src, dst, msg);
    }
});

module.exports = { WhisperHistory, WhisperPair };
