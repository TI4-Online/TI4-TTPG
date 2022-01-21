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
    
    static up(obj) {
        // RotX is 0 for faceup, -180 when flipped.
        const rotX = obj.getRotation().x % 360
        console.log(rotX)
        return -90 < rotX && rotX < 90
    }

    static down(obj) {
        return !Facing.up(obj)
    }
}

module.exports = { Facing }