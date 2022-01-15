const { Vector } = require('../mock/MockApi')
const assert = require('assert')

// Transforms for flat-top hex grid.
const _M = Object.freeze({
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
    // Angle to first corner (0 for flat-top hex).
    startAngle : 0.0
})

/**
 * Heavily distilled hex math based on RedBlobGames excellent hex docs.
 * "Hex" values are strings for easy use as keys and comparison.
 * @author Darrell
 */
 class HexLib {
    static HALF_SIZE = 3.5

    static _z = 0

    /**
     * HexLib is a static-only class, do not instantiate it.
     */
    constructor() {
        throw new Error('HexLib is static only')
    }

    static _hexFromString(hex) {
        assert(typeof hex === 'string')

        let [full, q, r, s] = hex.match(/^<(-?\d+),(-?\d+),(-?\d+)>$/)
        q = parseFloat(q)
        r = parseFloat(r)
        s = parseFloat(s)
        assert.equal(Math.round(q + r + s), 0, 'q + r + s must be 0')

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
        let x = pos.x / HexLib.HALF_SIZE
        let y = pos.y / HexLib.HALF_SIZE
        let q = _M.b0 * x + _M.b1 * y
        let r = _M.b2 * x + _M.b3 * y
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

        return HexLib._hexToString(qi, ri, si)
    }

    /**
     * Get position from hex.
     * 
     * @param {string} hex - Hex as "<q,r,s>" string
     * @returns {Vector} position
     */
    static toPosition(hex) {
        assert(typeof hex === 'string')

        let [q, r, s] = HexLib._hexFromString(hex)

        let x = (_M.f0 * q + _M.f1 * r) * HexLib.HALF_SIZE
        let y = (_M.f2 * q + _M.f3 * r) * HexLib.HALF_SIZE
        let z = HexLib._z
        return new Vector(x, y, z)    
    }

    /**
     * Get positions of hex corners.
     * First at +X, winding clockwise.
     * 
     * @param {string} hex - Hex as "<q,r,s>" string
     * @return {Array} list of position Vectors
     */
    static corners(hex) {
        assert(typeof hex === 'string')

        let center = HexLib.toPosition(hex)
        let result = []
        let z = HexLib._z
        for (let angle = 0; angle < 360; angle += 60) {
            let phi = _M.startAngle + angle * Math.PI / 180
            let x = center.x + HexLib.HALF_SIZE * Math.cos(phi)
            let y = center.y + HexLib.HALF_SIZE * Math.sin(phi)
            result.push(new Vector(x, y, z))
        }

        return result
    }

    /**
     * Get adjacent hexes.
     * 
     * @param {string} hex - Hex as "<q,r,s>" string
     * @return {Array} list of hex strings
     */
     static neighbors(hex) {
        assert(typeof hex === 'string')

        let [q, r, s] = HexLib._hexFromString(hex)
        return [
            HexLib._hexToString(q + 1, r + 0, s - 1),
            HexLib._hexToString(q + 1, r - 1, s + 0),
            HexLib._hexToString(q + 0, r - 1, s + 1),
            HexLib._hexToString(q - 1, r + 0, s + 1),
            HexLib._hexToString(q - 1, r + 1, s + 0),
            HexLib._hexToString(q + 0, r + 1, s - 1)
        ]
    }
}

module.exports.HexLib = HexLib

