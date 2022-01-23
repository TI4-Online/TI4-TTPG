const { Vector } = require('../wrapper/api')
const assert = require('../wrapper/assert')

// Transforms for flat-top hex grid.
const LAYOUT_FLAT = {
    // F(orward) translates hex to position.
    f0 : 3.0 / 2.0,
    f1 : 0.0,
    f2 : Math.sqrt(3.0) / 2.0,
    f3 : Math.sqrt(3.0),
    // B(ackward) translates position to hex.
    b0 : 2.0 / 3.0,
    b1 : 0.0,
    b2 : -1.0 / 3.0,
    b3 : Math.sqrt(3.0) / 3.0,
    // Angle to first corner.
    startAngle : 0.0
}

// Transforms for pointy-top hex grid.
const LAYOUT_POINTY = {
    // F(orward) translates hex to position.
    f0 : LAYOUT_FLAT.f3,
    f1 : LAYOUT_FLAT.f2,
    f2 : LAYOUT_FLAT.f1,
    f3 : LAYOUT_FLAT.f0,

    // B(ackward) translates position to hex.
    b0 : LAYOUT_FLAT.b3,
    b1 : LAYOUT_FLAT.b2,
    b2 : LAYOUT_FLAT.b1,
    b3 : LAYOUT_FLAT.b0,
    // Angle to first corner.
    startAngle : 0.5
}

const M = LAYOUT_POINTY

/**
 * Heavily distilled hex math based on RedBlobGames excellent hex docs.
 * "Hex" values are strings for easy use as keys and comparison.
 * @author Darrell
 */
 class Hex {
    static HALF_SIZE = 5.77735  // Half of hex width, 11.547cm

    static _z = 0

    /**
     * Hex is a static-only class, do not instantiate it.
     */
    constructor() {
        throw new Error('Hex is static only')
    }

    static _hexFromString(hex) {
        assert(typeof hex === 'string')

        let [full, q, r, s] = hex.match(/^<(-?\d+),(-?\d+),(-?\d+)>$/)
        q = parseFloat(q)
        r = parseFloat(r)
        s = parseFloat(s)
        assert(Math.round(q + r + s) == 0, 'q + r + s must be 0')

        return [q, r, s]
    }

    static _hexToString(q, r, s) {
        assert(typeof q === 'number')
        assert(typeof r === 'number')
        assert(typeof s === 'number')

        return `<${q},${r},${s}>`
    }

    /**
     * Get hex at position.
     * 
     * @param {Vector} pos - Cartesian position on XY surface
     * @param {number} pos.x
     * @param {number} pos.y
     * @param {number} pos.z
     * @returns {string} hex as "<q,r,s>" string
     */
    static fromPosition(pos) {
        assert(typeof pos === 'object')
        assert(typeof pos.x === 'number')
        assert(typeof pos.y === 'number')
        assert(typeof pos.z === 'number')

        // Fractional hex position.
        let x = pos.x / Hex.HALF_SIZE
        let y = pos.y / Hex.HALF_SIZE
        let q = M.b0 * x + M.b1 * y
        let r = M.b2 * x + M.b3 * y
        let s = -q - r

        // Round to grid aligned hex.
        let qi = Math.round(q)
        let ri = Math.round(r)
        let si = Math.round(s)
        let q_diff = Math.abs(qi - q)
        let r_diff = Math.abs(ri - r)
        let s_diff = Math.abs(si - s)
        if (q_diff > r_diff && q_diff > s_diff) {
            qi = -ri - si
        } else {
            if (r_diff > s_diff) {
                ri = -qi - si
            } else {
                si = -qi - ri
            }
        }

        return Hex._hexToString(qi, ri, si)
    }

    /**
     * Get position from hex.
     * 
     * @param {string} hex - Hex as "<q,r,s>" string
     * @returns {Vector} position
     */
    static toPosition(hex) {
        assert(typeof hex === 'string')

        let [q, r, s] = Hex._hexFromString(hex)

        let x = (M.f0 * q + M.f1 * r) * Hex.HALF_SIZE
        let y = (M.f2 * q + M.f3 * r) * Hex.HALF_SIZE
        let z = Hex._z
        return new Vector(x, y, z)    
    }

    /**
     * Get positions of hex corners.
     * First at "top right", winding counterclockwise.
     * 
     * @param {string} hex - Hex as "<q,r,s>" string
     * @return {Array} list of position Vectors
     */
    static corners(hex) {
        assert(typeof hex === 'string')

        let center = Hex.toPosition(hex)
        let result = []
        let z = Hex._z
        for (let i = 0; i < 6; i++) {
            const phi = 2 * Math.PI * (M.startAngle - i) / 6
            let x = center.x + Hex.HALF_SIZE * Math.cos(phi)
            let y = center.y + Hex.HALF_SIZE * Math.sin(phi)
            result.push(new Vector(x, y, z))
        }

        return result
    }

    /**
     * Get adjacent hexes.
     * First is "above", winding counterclockwise.
     * 
     * @param {string} hex - Hex as "<q,r,s>" string
     * @return {Array} list of hex strings
     */
     static neighbors(hex) {
        assert(typeof hex === 'string')

        let [q, r, s] = Hex._hexFromString(hex)
        return [
            Hex._hexToString(q + 1, r + 0, s - 1),
            Hex._hexToString(q + 1, r - 1, s + 0),
            Hex._hexToString(q + 0, r - 1, s + 1),
            Hex._hexToString(q - 1, r + 0, s + 1),
            Hex._hexToString(q - 1, r + 1, s + 0),
            Hex._hexToString(q + 0, r + 1, s - 1)
        ]
    }
}

module.exports.Hex = Hex

