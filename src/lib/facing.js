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
        // RotX is 0 for faceup, -180 when flipped.
        const rotX = obj.getRotation().x % 360
        console.log(rotX)
        return -90 < rotX && rotX < 90
    }

    static isFaceDown(obj) {
        return !Facing.isFaceUp(obj)
    }
}

module.exports = { Facing }