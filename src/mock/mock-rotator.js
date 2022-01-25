/**
 * Mock https://api.tabletop-playground.com/classes/_api_.rotator.html
 */
 class Rotator {
    constructor(pitch, yaw, roll) {
        this.pitch = pitch
        this.yaw = yaw
        this.roll = roll
    }
}

module.exports.Rotator = Rotator