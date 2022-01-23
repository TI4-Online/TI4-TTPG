/**
 * Player turn manager.
 */
class Turns {
    /**
     * Static-only class, do not instantiate it.
     */
     constructor() {
        throw new Error('Static only')
    }

    /**
     * Is it this player's turn?
     * 
     * @param {Player} player 
     * @returns {boolean}
     */
    static isActivePlayer(player) {
        // TODO XXX
        return true
    }
}

module.exports = {
    Turns
}