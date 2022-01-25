const { MockGameObject } = require('../mock/mock-game-object');
const ReturnGameObjectHome = require('./return-game-object-home');

describe('ReturnGameObjectHome', () => {
  
  describe('#returnAll', () => {
    let objectsToReturn

    beforeEach(() => {
      objectsToReturn = [
        new MockGameObject({ id: 'some/object' }),
        new MockGameObject({ id: 'another/object' }),
      ]
      jest.spyOn(ReturnGameObjectHome, 'return')
      ReturnGameObjectHome.returnAll(objectsToReturn)
    });

    it('should call #return for each object', () => {
      expect(ReturnGameObjectHome.return).toHaveBeenCalledWith(objectsToReturn[0])
      expect(ReturnGameObjectHome.return).toHaveBeenCalledWith(objectsToReturn[1])
    });
  });
});
