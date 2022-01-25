const ReturnGameObjectHome = require('../../lib/return-game-object-home');

class GraveyardContainer {

  constructor(refContainer) {
    refContainer.onInserted.add(this.onInserted);
  }

  onInserted(container, insertedObjects) {
    ReturnGameObjectHome.returnAll(insertedObjects)
  }
}

module.exports = GraveyardContainer
