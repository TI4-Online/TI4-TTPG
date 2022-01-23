const moveGameObjectHome = require('../../lib/move-game-object-home');

class GraveyardContainer {

  constructor(refContainer) {
    refContainer.onInserted.add(this.onInserted);
  }

  onInserted(container, insertedObjects) {
    for (let i = 0; i < insertedObjects.length; i++) {
      moveGameObjectHome(insertedObjects[i])
    }
  }
}

module.exports = GraveyardContainer
