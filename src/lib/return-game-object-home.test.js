const { MockGameObject } = require('../mock/mock-game-object');
const ReturnGameObjectHome = require('./return-game-object-home');

describe('ReturnGameObjectHome', () => {

    describe('instantiation', () => {
        it('throws an error when instantiated', () => {
            expect(() => { new ReturnGameObjectHome() }).toThrow()
        })
    });
    
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

        afterEach(() => {
            jest.clearAllMocks()
        });

        it('should call #return for each object', () => {
            expect(ReturnGameObjectHome.return).toHaveBeenCalledWith(objectsToReturn[0])
            expect(ReturnGameObjectHome.return).toHaveBeenCalledWith(objectsToReturn[1])
        });
    });

    describe('#return', () => {
        const objectTypes = [
            {
                name: 'card',
                templateMetadata: 'card.action:base/direct_hit.2',
                delegateMethodName: 'returnCard'
            },
            {
                name: 'command token',
                templateMetadata: 'token.command:base/arborec',
                delegateMethodName: 'returnToPlayerReinforcements'
            },
            {
                name: 'control token',
                templateMetadata: 'token.control:base/arborec',
                delegateMethodName: 'returnToPlayerReinforcements'
            },
            {
                name: 'strategy card',
                templateMetadata: 'tile.strategy:base/leadership.omega',
                delegateMethodName: 'returnStrategyCard'
            },
            {
                name: 'system tile',
                templateMetadata: 'tile.system:base/18',
                delegateMethodName: 'returnSystemTile'
            },
            {
                name: 'token',
                templateMetadata: 'token.vuilraith:pok/tear.nekro',
                delegateMethodName: 'returnToken'
            },
            {
                name: 'unit',
                templateMetadata: 'unit:base/dreadnought',
                delegateMethodName: 'returnToPlayerReinforcements'
            },
        ]

        objectTypes.forEach(({ name, templateMetadata, delegateMethodName }) => {
            describe(`returning a ${name}`, () => {
                let object
    
                beforeEach(() => {
                    jest.spyOn(ReturnGameObjectHome, delegateMethodName)
                    object = new MockGameObject({ templateMetadata })
                    ReturnGameObjectHome.return(object)
                });
    
                it(`calls ${delegateMethodName}`, () => {
                    expect(ReturnGameObjectHome[delegateMethodName]).toHaveBeenCalledWith(object)
                });
            });
        })

        describe('returning an unknown object type', () => {
            it('throws an error', () => {
                const unknownObject = new MockGameObject({ templateMetadata: 'unknown.thing:fiz.bit/wiz.tot' })
                expect(() => ReturnGameObjectHome.return(unknownObject)).toThrow()
            });
        });
    });
});
