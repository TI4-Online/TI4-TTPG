/**
 * TTPG doesn't have GameObject.isFaceUp.
 */
class Facing {
    /**
     * Static-only class, do not instantiate it.
     */
    constructor() {
        throw new Error('Static only')
    }
    
    static isFaceUp(obj) {
        // roll is 0 for faceup, -180 when flipped.
        const roll = obj.getRotation().roll % 360
        return -90 < roll && roll < 90
    }

    static isFaceDown(obj) {
        return !Facing.isFaceUp(obj)
    }
}

module.exports = { Facing }