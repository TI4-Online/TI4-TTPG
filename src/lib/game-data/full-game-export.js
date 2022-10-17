/**
 * Export full table state, to be used as an intermediate data format
 * when transfering a game to Async TI4.
 */
class FullGameExport {
    static exportAttachments() {}
    static exportPlayerCardHolders() {}
    static exportUnits() {}
}

module.exports = { FullGameExport };
