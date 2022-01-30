const { Hex } = require('../hex')

/**
 * Hex maths to go from index in a one-dimensional array to an hex coordinates, and reverse.
 * All hex maths are based on the awesome work of redblobgames : https://www.redblobgames.com/grids/hexagons/
 * 
 * Hex use Cube coordinates
 * Map array list all hexes, starting with center, spiralling outwards.
 * For each ring, firt entry is r: 0, q > 0
 * 
 * @author Somberlord
 */


/**
 * Returns the index for the first hex of each ring. This is used as an offset for all other hexes on the ring.
 * 
 * The number of hexes in each ring is 6 * ring_radius
 * The offset for the first hex of each ring is the sum of the size of each previous ring, plus one.
 * We use triangular number for the previous ring, and multiply it by 6 to get that number.
 * 
 * More info : https://www.redblobgames.com/grids/hexagons/#rings https://en.wikipedia.org/wiki/Triangular_number
 * @param {radius} radius of the ring
 * @returns offset for the first tile of the ring
 */
const getOffset = function(radius) {
    if(radius == 0) return 0;
    return 1 + (radius-1) * radius / 2 * 6
}


/**
 * Get the index in the map array for any arbitraty hex
 * 
 * @params Cube coordinates of the hex
 * @returns Index in the map array
 */
const hexToIdx = function(q, r, s) {
    // Radius from a zero-centered hex grid is the max of the absolute coordinates. More info : https://www.redblobgames.com/grids/hexagons/#distances
    var radius = Math.max( Math.abs(q), Math.abs(r), Math.abs(s))
    // center hex is idx 0. Most computation does not work for radius zero.
    if(radius == 0) return 0;

    var offset = getOffset(radius)

    // Each ring has a size of radius * 6
    // Every hex on the ring is between offset and offset + radius*6
    // We split the ring into 6 sides. Each sides matches one coordinates that is maxed out (positive or negative)
    // In each side, one coordinate starts at zero, and increments to radius or -radius
    switch(radius) {
        case -s: 
            return offset + r;
        case r:
            return offset + radius - q;
        case -q:
            return offset + 2 * radius + s;
        case s:
            return offset + 3 * radius - r;
        case -r:
            return offset + 4 * radius + q;
        case q:
            return offset + 5 * radius -s;
    }
}


/**
 * Get the corresponding hex for any index in the map array
 * 
 * @param {idx} idx index in the map array
 * @returns Cube coordinates of the corresponding hex
 */
const idxToHex = function(idx) {
    // idx 0 is center hex. Most computation does not work for radius zero.
    if(idx == 0) return {q: 0, r: 0, s: 0}
    
    // Compute radius by checking what is the greatest offset, still inferior to idx
    var i = 1;
    var offset = getOffset(i);
    while(offset <= idx) {
        i++;
        offset = getOffset(i);
    }
    var radius = i-1;

    // Compute exact ring position, and side position
    // See hexToIdx for corresponding maths
    offset = getOffset(radius);
    var ring_position = idx - offset;
    var side = Math.floor(ring_position / radius);
    var ring_offset = side * radius;
    var local_position = ring_position - ring_offset;

    // Compute hex coordinates from side and size position
    // One coordinates is maxed out to radius or -radius
    // One is local_position or -local_position
    // Sum of the 3 Cube coordinates must always be equal to zero
    var s, q, r;
    switch(side) {
        case 0:
            s = -radius; r = local_position; q = -s-r; break;
        case 1:
            r= radius; q= -local_position; s= -r-q; break;
        case 2:
            s= local_position; q= -radius; r= -s-q; break;
        case 3:
            s= radius; r= -local_position; q= -s-r; break;
        case 4:
            r= -radius; q= local_position; s= -r-q; break;
        case 5:
            s= -local_position; q= radius; r= -s-q; break;
    }
    return {q: q, r: r, s: s}
}

/**
 * hexToIdx but using the string version from lib/Hex.
 * 
 * @param {string} hexString 
 * @returns {number}
 */
const hexStringToIdx = function(hexString) {
    const [ q, r, s ] = Hex._hexFromString(hexString)
    return hexToIdx(q, r, s)
}

/**
 * idxToHex but using the string version from lib/Hex.
 * 
 * @param {number} idx 
 * @returns {string}
 */
const idxToHexString = function(idx) {
    const hexObject = idxToHex(idx)
    return Hex._hexToString(hexObject.q, hexObject.r, hexObject.s)
}

module.exports = {
    hexToIdx,
    idxToHex,
    hexStringToIdx,
    idxToHexString
}