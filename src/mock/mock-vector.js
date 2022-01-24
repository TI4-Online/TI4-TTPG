/**
 * Mock https://api.tabletop-playground.com/classes/_api_.vector.html
 */
class Vector {
    constructor(x, y, z) {
        this.x = x
        this.y = y
        this.z = z

        this.pitch = y
        this.yar = z
        this.roll = x
    }
}

module.exports.Vector = Vector