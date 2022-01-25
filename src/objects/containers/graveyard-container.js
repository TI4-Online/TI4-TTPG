const ReturnGameObjectHome = require('../../lib/return-game-object-home');

class GraveyardContainer {

    constructor(refContainer) {
        refContainer.onInserted.add(this.onInserted);
    }

    /**
     * Handler for refContainer onInserted event
     * @param {refContainer} container The refContainer that was inserted into
     * @param {GameObject[]} insertedObjects Game objects inserted
     */
    onInserted(container, insertedObjects) {
        ReturnGameObjectHome.returnAll(insertedObjects)
    }
}

module.exports = GraveyardContainer
