const { Card } = require('../wrapper/api')

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
        // roll is 0 for faceup, -180 or 180 when flipped.
        let roll = obj.getRotation().roll % 360  // [-360:360]
        roll = (roll + 360) % 360  // [0:360]

        // TTPG cards show the back on top when in the natural rotation.
        if ((obj instanceof Card) && !obj.getCardDetails().flipped) {
            roll = (roll + 180) % 360  // [0:360]
        }

        return roll < 90 || roll > 270
    }

    static isFaceDown(obj) {
        return !Facing.isFaceUp(obj)
    }
}

module.exports = { Facing }