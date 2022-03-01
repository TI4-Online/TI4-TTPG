const assert = require("../../wrapper/assert-wrapper");
const { ColorUtil } = require("../color/color-util");
const {
    Dice,
    GameObject,
    Player,
    Vector,
    globalEvents,
    world,
} = require("../../wrapper/api");

const _rollInProgressDieGuidToSimpleDie = {};

/**
 * Setup die.
 */
class SimpleDieBuilder {
    /**
     * Constructor.
     */
    constructor() {
        this._color = false;
        this._deleteAfterSeconds = -1;
        this._critCount = 1;
        this._critValue = Number.MAX_SAFE_INTEGER;
        this._hitValue = Number.MAX_SAFE_INTEGER;
        this._name = false;
        this._reroll = false;
        this._spawnPosition = false;
    }

    /**
     * Rolling a crit generates this many extra hits.
     *
     * @param {number} value
     * @returns {SimpleDie} self for chaining
     */
    setCritCount(value) {
        assert(typeof value === "number");
        this._critCount = value;
        return this;
    }

    /**
     * Rolling this number or above is a crit.
     *
     * @param {number} value
     * @returns {SimpleDie} self for chaining
     */
    setCritValue(value) {
        assert(typeof value === "number");
        this._critValue = value;
        return this;
    }

    /**
     * Die color.
     *
     * @param {Color} color
     * @returns {SimpleDie} self for chaining
     */
    setColor(color) {
        assert(ColorUtil.isColor(color));
        this._color = color;
        return this;
    }

    /**
     * Delete die GameObject after N seconds, the SimpleDie wrapper remains.
     * Set to negative to keep forever, default is keep forever.
     *
     * @param {number} value
     * @returns {SimpleDie} self for chaining
     */
    setDeleteAfterSeconds(value) {
        assert(typeof value === "number");
        this._deleteAfterSeconds = value;
        return this;
    }

    /**
     * Rolling this number or above is a hit.
     *
     * @param {number} value
     * @returns {SimpleDie} self for chaining
     */
    setHitValue(value) {
        assert(typeof value === "number");
        this._hitValue = value;
        return this;
    }

    /**
     * Die name.
     *
     * @param {string} name - localized name
     * @returns {SimpleDie} self for chaining
     */
    setName(name) {
        assert(typeof name === "string");
        this._name = name;
        return this;
    }

    /**
     * Reroll once if first roll is below hit value.
     *
     * @param {boolean} value
     * @returns {SimpleDie} self for chaining
     */
    setReroll(value) {
        assert(typeof value === "boolean");
        this._reroll = value;
        return this;
    }

    /**
     *
     * @param {Position} pos
     * @returns {SimpleDie} self for chaining
     */
    setSpawnPosition(pos) {
        assert(typeof pos.x === "number");
        this._spawnPosition = pos;
        return this;
    }

    /**
     * Create the die wrapper and die GameObject.
     *
     * @param {Player} player
     * @returns {SimpleDie}
     */
    build(player) {
        assert(player instanceof Player);
        return new SimpleDie(this, player);
    }
}

/**
 * Manage a die GameObject.
 */
class SimpleDie {
    static objToRollInProgressSimpleDie(obj) {
        assert(obj instanceof GameObject);
        const guid = obj.getId();
        return _rollInProgressDieGuidToSimpleDie[guid];
    }

    /**
     * Constructor.  Use SimpleDieBuilder.build() to create.
     *
     * @param {SimpleDieBuilder} builder
     * @param {Player} player
     */
    constructor(builder, player) {
        assert(builder instanceof SimpleDieBuilder);
        assert(player instanceof Player);

        this._critCount = builder._critCount;
        this._critValue = builder._critValue;
        this._hitValue = builder._hitValue;
        this._reroll = builder._reroll;

        this._player = player;
        this._value = false;
        this._preRerollValue = false;
        this._callback = false;

        // TTPG D10.
        const templateId = "9065AC5141F87F8ADE1F5AB6390BBEE4";
        let pos = builder._spawnPosition;
        if (!pos) {
            pos = new Vector(0, 0, world.getTableHeight() + 5);
        }
        this._die = world.createObjectFromTemplate(templateId, pos);
        assert(this._die instanceof Dice);

        if (builder._color) {
            this._die.setPrimaryColor(builder._color);
        }
        if (builder._deleteAfterSeconds > 0 && !world.__isMock) {
            const delayedDelete = () => {
                if (this._die.isValid()) {
                    this._die.destroy();
                    delete this._die;
                }
            };
            setTimeout(delayedDelete, builder._deleteAfterSeconds * 1000);
        }
        if (builder._name) {
            this._die.setName(builder._name);
        }
    }

    /**
     * Accounting for crits, how many hits did this roll generate?
     */
    countHits() {
        let result = 0;
        if (this.isHit()) {
            result += 1;
        }
        if (this.isCrit()) {
            result += this.getCritCount();
        }
        return result;
    }

    /**
     * Rolling a crit generates this many extra hits.
     *
     * @returns {number}
     */
    getCritCount() {
        return this._critCount;
    }

    /**
     * Rolling this number or above is a crit.
     *
     * @returns {number}
     */
    getCritValue() {
        return this._critValue;
    }

    /**
     * Rolling this number or above is a crit.
     *
     * @returns {number}
     */
    getHitValue() {
        return this._hitValue;
    }

    /**
     * Destroy the die GameObject.
     */
    destroy() {
        // No need to cancel roll in progrss, globalEvents.onObjectDestroyed
        // handler takes care of that.
        if (this._die.isValid()) {
            this._die.destroy();
        }
    }

    /**
     * Roll (or reroll) the die.
     *
     * @returns {SimpleDie}
     */
    roll(callback) {
        assert(typeof callback === "function");
        assert(this._die.isValid());

        this._callback = callback;

        const guid = this._die.getId();
        assert(!_rollInProgressDieGuidToSimpleDie[guid]); // roll in progress
        _rollInProgressDieGuidToSimpleDie[guid] = this;
        this._die.roll(this._player); // MUST set player to get OnDiceRolled events

        return this;
    }

    /**
     * Apply the die roll result.
     *
     * Called by globalEvents.onDiceRolled.
     */
    finishRoll() {
        const guid = this._die.getId();
        assert(_rollInProgressDieGuidToSimpleDie[guid]); // roll in progress
        delete _rollInProgressDieGuidToSimpleDie[guid];

        this._value = this._die.isValid()
            ? this._die.getCurrentFaceIndex() + 1
            : -1;

        // Reroll if enabled and this is a miss.
        if (
            this._die.isValid() &&
            this._reroll &&
            this._value < this._hitValue
        ) {
            this._reroll = false;
            this._preRerollValue = this._value;
            this.roll(this._callback);
            return; // wait for reroll to finish
        }

        if (this._callback) {
            // Release callback BEFORE invoking it.
            // Presense of a callback signals roll in progress.
            const callback = this._callback;
            this._callback = false;
            callback(this);
        }
    }

    /**
     * True if roll result >= crit value.
     *
     * @returns {boolean}
     */
    isCrit() {
        return this._value >= this._critValue;
    }

    /**
     * True if roll result >= hit value.
     *
     * @returns {boolean}
     */
    isHit() {
        return this._value >= this._hitValue;
    }

    /**
     * True if first roll missed and die was rerolled.
     *
     * @returns {boolean}
     */
    isReroll() {
        return this._preRerollValue !== false;
    }

    /**
     * True if roll is in progress.
     *
     * @returns {boolean}
     */
    isRolling() {
        return this._callback !== false;
    }

    /**
     * Roll result.
     *
     * @returns {number}
     */
    getValue() {
        return this._value;
    }

    /**
     * Roll result with hit/crit/reroll encoding.
     *
     * @returns {string}
     */
    getValueStr() {
        const parts = [];

        if (this._preRerollValue !== false) {
            parts.push(`${this._preRerollValue}->`);
        }

        parts.push(`${this._value}`);

        if (this.isHit()) {
            parts.push("#");
        }
        if (this.isCrit()) {
            for (let i = 0; i < this.getCritCount(); i++) {
                parts.push("#");
            }
        }
        return parts.join("");
    }
}

// Roll finished.
globalEvents.onDiceRolled.add((player, dieObjs) => {
    assert(player instanceof Player);
    assert(Array.isArray(dieObjs));
    for (const dieObj of dieObjs) {
        assert(dieObj instanceof Dice);
        const simpleDie = SimpleDie.objToRollInProgressSimpleDie(dieObj);
        if (simpleDie) {
            // Rerolling from inside onDiceRolled callback does not trigger
            // onDiceRolled callback for reroll.  Wait a moment then reroll
            // (which does get callback).  Bug filed Feb 2022.
            process.nextTick(() => {
                simpleDie.finishRoll();
            });
        }
    }
});

// Die deleted before roll finished??
globalEvents.onObjectDestroyed.add((obj) => {
    assert(obj instanceof GameObject);
    const simpleDie = SimpleDie.objToRollInProgressSimpleDie(obj);
    if (simpleDie) {
        simpleDie.finishRoll();
    }
});

module.exports = { SimpleDieBuilder, SimpleDie };
