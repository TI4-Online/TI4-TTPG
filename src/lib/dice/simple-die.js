const assert = require("../../wrapper/assert");
const {
    Color,
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
        this._critValue = Number.MAX_SAFE_INTEGER;
        this._hitValue = Number.MAX_SAFE_INTEGER;
        this._name = false;
        this._reroll = false;
        this._spawnPosition = false;
    }

    /**
     * Rolling this number or above is a crit.
     *
     * @param {number} value
     * @returns {SimpleDie} self for chaining
     */
    setCritValue(value) {
        assert(value instanceof "number");
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
        assert(color instanceof Color);
        this._color = color;
        return this;
    }

    /**
     * Delete die GameObject after N seconds.  The SimpleDie wrapper remains.
     * By default die never deletes itself.
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

        if (!this._spawnPosition) {
            this._spawnPosition = new Vector(0, 0, world.getTableHeight() + 5);
        }

        return new SimpleDie(this, player);
    }
}

/**
 * Manage a die GameObject.
 */
class SimpleDie {
    /**
     * Constructor.  Use SimpleDieBuilder.build() to create.
     *
     * @param {SimpleDieBuilder} builder
     * @param {Player} player
     */
    constructor(builder, player) {
        assert(builder instanceof SimpleDieBuilder);
        assert(player instanceof Player);

        this._critValue = builder._critValue;
        this._hitValue = builder._hitValue;
        this._reroll = builder._reroll;

        this._player = player;
        this._value = false;
        this._preRerollValue = false;

        // TTPG D10.
        const templateId = "9065AC5141F87F8ADE1F5AB6390BBEE4";
        const pos = builder._spawnPosition;
        this._die = world.createObjectFromTemplate(templateId, pos);
        assert(this._die instanceof Dice);

        if (builder._color) {
            this._die.setPrimaryColor(this._color);
        }
        if (builder._deleteAfterSeconds > 0) {
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
     * Roll the die.
     *
     * @returns {SimpleDie}
     */
    roll(callback) {
        assert(typeof callback === "function");
        assert(this._die.isValid());
        assert(this._value === false); // can only roll once!

        this._callback = callback;

        const guid = this._die.getId();
        assert(!_rollInProgressDieGuidToSimpleDie[guid]); // roll in progress?
        _rollInProgressDieGuidToSimpleDie[guid] = this;
        this._die.roll(this._player); // MUST set player to get OnDiceRolled events

        return this;
    }

    /**
     * Set the die roll result.
     *
     * This is normally called only by globalEvents.onDiceRolled, but
     * expose for unittests.
     *
     * @param {number} value
     * @returns {SimpleDie} self for chaining
     */
    setValue(value) {
        assert(typeof value === "number");

        // Reroll if enabled and this is a miss.
        if (this._die.isValid() && this._reroll && value < this._hitValue) {
            this._reroll = false;
            this._preRerollValue = value;

            // Rerolling from inside onDiceRolled callback does not trigger
            // onDiceRolled callback for reroll.  Wait a moment then reroll
            // (which does get callback).  Bug filed Feb 2022.
            const delayedReroll = () => {
                this.roll(this._callback);
            };
            setTimeout(delayedReroll, 10);

            return; // wait for reroll to finish
        }

        this._value = value;
        if (this._callback) {
            this._callback(this);
        }
        return this;
    }

    /**
     * True after roll (or reroll) rinishes.
     *
     * @returns {boolean}
     */
    hasValue() {
        return this._value !== false; // value set when roll finishes
    }

    /**
     * True if roll result >= crit value.
     *
     * @returns {boolean}
     */
    isCrit() {
        assert(this.hasValue());
        return this._value >= this._critValue;
    }

    /**
     * True if roll result >= hit value.
     *
     * @returns {boolean}
     */
    isHit() {
        assert(this.hasValue());
        return this._value >= this._hitValue;
    }

    /**
     * True if first roll missed and die was rerolled.
     *
     * @returns {boolean}
     */
    isReroll() {
        assert(this.hasValue());
        return this._preRerollValue !== false;
    }

    /**
     * Roll result.
     *
     * @returns {number}
     */
    getValue() {
        assert(this.hasValue());
        return this._value;
    }

    /**
     * Roll result with hit/crit/reroll encoding.
     *
     * @returns {string}
     */
    getValueString() {
        assert(this.hasValue());
        const parts = [];

        if (this._preRerollValue !== false) {
            parts.push(`${this._preRerollValue}->`);
        }

        parts.push(`${this._value}`);

        if (this._value >= this._critValue) {
            parts.push("$");
        } else if (this._value >= this._hitValue) {
            parts.push("*");
        }

        return parts.join("");
    }
}

// Roll finished.
globalEvents.onDiceRolled.add((player, dieObjs) => {
    assert(player instanceof Player);
    assert(Array.isArray(dieObjs));
    for (const dieObj of dieObjs) {
        assert(dieObj instanceof GameObject);
        const guid = dieObj.getId();
        const simpleDie = _rollInProgressDieGuidToSimpleDie[guid];
        if (simpleDie) {
            delete _rollInProgressDieGuidToSimpleDie[guid];
            const value = dieObj.getCurrentFaceIndex() + 1;
            simpleDie.setValue(value);
        }
    }
});

// Die deleted before roll finished??
globalEvents.onObjectDestroyed.add((obj) => {
    assert(obj instanceof GameObject);
    const guid = obj.getId();
    const simpleDie = _rollInProgressDieGuidToSimpleDie[guid];
    if (simpleDie) {
        delete _rollInProgressDieGuidToSimpleDie[guid];
        simpleDie.setValue(-1);
    }
});

module.exports = { SimpleDieBuilder, SimpleDie };
