const { world } = require('@tabletop-playground/api')
const { MockGameObject } = require('../mock/mock-api')
const GameObjectFinder = require('./game-object-finder');

const createMockGameObject = (metadata, playerSlot) => {
    const args = { templateMetadata : metadata }

    if(playerSlot) {
        args.owningPlayerSlot = playerSlot
    }

    return new MockGameObject(args)
}

describe('GameObjectFinder', () => {
    const targetUnitMetadata = 'unit:base/fighter'
    let worldObjects

    beforeEach(() => {
        jest.spyOn(world, 'getAllObjects').mockImplementation(() => worldObjects)
    });

    afterEach(() => {
        jest.clearAllMocks()
        GameObjectFinder.clearCache()
    });

    describe('#getPlayerUnitBag', () => {
        beforeEach(() => {
            worldObjects = [
                ...[1, 2, 3].map(slot => createMockGameObject(`bag.${targetUnitMetadata}`, slot)),
                ...[1, 2, 3].map(slot => createMockGameObject(`bag.unit:base/dreadnought`, slot)),
            ]
        });

        it('returns the correct unit bag', () => {
            expect(GameObjectFinder.getPlayerUnitBag(2, targetUnitMetadata)).toBe(worldObjects[1])
        });

        describe('subsequent calls for the same object', () => {
            let secondCallReturn

            beforeEach(() => {
                GameObjectFinder.getPlayerUnitBag(2, targetUnitMetadata)
                secondCallReturn = GameObjectFinder.getPlayerUnitBag(2, targetUnitMetadata)
            });

            it('returns the correct unit bag', () => {
                expect(secondCallReturn).toBe(worldObjects[1])
            });

            it('only searches for the bag once', () => {
                expect(world.getAllObjects).toHaveBeenCalledTimes(1)
            });
        });
    });
});

