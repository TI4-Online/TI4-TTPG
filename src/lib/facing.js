/**
 * TTPG doesn't have GameObject.isFaceUp.
 * DO NOT USE THIS ON CARDS!  Use `Card.isFaceUp()`.
 */
class Facing {
    /**
     * Static-only class, do not instantiate it.
     */
    constructor() {
        throw new Error("Static only");
    }

    static isFaceUp(obj) {
        // roll is 0 for faceup, -180 or 180 when flipped.
        let roll = obj.getRotation().roll % 360; // [-360:360]
        roll = (roll + 360) % 360; // [0:360]
        return roll < 90 || roll > 270;
    }

    static isFaceDown(obj) {
        return !Facing.isFaceUp(obj);
    }
}

module.exports = { Facing };
