jest.mock('../../lib/move-game-object-home')

const { MockGameObject } = require('../../mock/mock-game-object');
const { MockGameObjectContainer } = require('../../mock/mock-game-object-container');
const GraveyardContainer = require('./graveyard-container');
const moveGameObjectHome = require('../../lib/move-game-object-home');

describe('GraveyardContainer', () => {
  let refContainer
  let graveyard
  
  beforeEach(() => {
    refContainer = new MockGameObjectContainer()
    graveyard = new GraveyardContainer(refContainer)
  });

  describe('inserting objects', () => {
    let insertedObjects

    beforeEach(() => {
      insertedObjects = [
        new MockGameObject({ id: 'token.command:base/arborec' }),
        new MockGameObject({ id: 'token.vuilraith:pok/tear.nekro' }),
      ]
      refContainer.onInserted.trigger(refContainer, insertedObjects)
    });
    
    it('calls moveGameObjectHome on each insterted game object', () => {
      expect(moveGameObjectHome).toHaveBeenCalledWith(insertedObjects[0])
      expect(moveGameObjectHome).toHaveBeenCalledWith(insertedObjects[1])
    });
  });

});

