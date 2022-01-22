const assert = require('../wrapper/assert')

/**
 * Convert TTPG Color to string value (e.g., "blue")
 */
class PlayerColor {
    /**
     * Static-only class, do not instantiate it.
     */
     constructor() {
        throw new Error('Static only')
    }

    /**
     * Translate a TTPG Color to a string value.
     * 
     * @param {Color} color 
     * @returns {string}
     */
    static fromColor(color) {
        // TODO XXX
        return 'white'
    }

    /**
     * Get color from the game object saved data JSON _color field.
     * 
     * Caller is responsible for making sure the object follows this
     * standard, or should be ready for a parse SyntaxError exception.
     * 
     * @param {GameObject} obj 
     * @returns {string} color, if known
     * @throws {SyntaxError}
     */
    static fromObject(obj) {
        const s = obj.getSavedData()
        if (s && s.length > 0) {
            return JSON.parse(s)._color
        }
    }

    /**
     * Edit the game object saved data JSON to add _color.
     * 
     * Caller is responsible for making sure the object follows this
     * standard, or should be ready for a parse SyntaxError exception.
     *
     * @param {GameObject} obj 
     * @param {string} color
     * @throws {SyntaxError}
     */
    static setObjectColor(obj, color) {
        assert(typeof color === 'string')
        const s = obj.getSavedData()
        let json
        if (s && s.length > 0) {
            json = JSON.parse(s)
        } else {
            json = {}
        }
        json._color = color
        obj.setSavedData(JSON.stringify(json))
    }
}

module.exports = { PlayerColor }