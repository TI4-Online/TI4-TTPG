const { MockContainer, MockGameObject } = require("../mock/mock-api");
const GameObjectFinder = require("./game-object-finder");
const ReturnGameObjectHome = require("./return-game-object-home");

describe("ReturnGameObjectHome", () => {

    afterEach(() => {
        jest.restoreAllMocks()
        GameObjectFinder.clearCache()
    });

    describe("instantiation", () => {
        it("throws an error when instantiated", () => {
            expect(() => { new ReturnGameObjectHome() }).toThrow()
        })
    });
    
    describe("#returnAll", () => {
        let objectsToReturn

        beforeEach(() => {
            objectsToReturn = [
                new MockGameObject({ templateMetadata: "card.action:base/direct_hit.2" }),
                new MockGameObject({ templateMetadata: "token.command:base/arborec" }),
            ]
            jest.spyOn(ReturnGameObjectHome, "return")
            ReturnGameObjectHome.returnAll(objectsToReturn)
        });

        it("should call #return for each object", () => {
            expect(ReturnGameObjectHome.return).toHaveBeenCalledWith(objectsToReturn[0])
            expect(ReturnGameObjectHome.return).toHaveBeenCalledWith(objectsToReturn[1])
        });
    });

    describe("#return", () => {
        const objectTypes = [
            {
                name: "card",
                objectData: { templateMetadata: "card.action:base/direct_hit.2" },
                delegateMethodName: "returnCard"
            },
            {
                name: "command token",
                objectData: { templateMetadata: "token.command:base/arborec" },
                delegateMethodName: "returnToPlayerReinforcements"
            },
            {
                name: "control token",
                objectData: { templateMetadata: "token.control:base/arborec" },
                delegateMethodName: "returnToPlayerReinforcements"
            },
            {
                name: "strategy card",
                objectData: { templateMetadata: "tile.strategy:base/leadership.omega" },
                delegateMethodName: "returnStrategyCard"
            },
            {
                name: "system tile",
                objectData: { templateMetadata: "tile.system:base/18" },
                delegateMethodName: "returnSystemTile"
            },
            {
                name: "token",
                objectData: { templateMetadata: "token.vuilraith:pok/tear.nekro" },
                delegateMethodName: "returnToken"
            },
            {
                name: "unit",
                objectData: {
                    templateMetadata: "unit:base/dreadnought",
                    owningPlayerSlot: 4,
                },
                delegateMethodName: "returnPlayerUnit"
            },
        ]

        objectTypes.forEach(({ name, objectData, delegateMethodName }) => {
            describe(`returning a ${name}`, () => {
                let object
    
                beforeEach(() => {
                    jest.spyOn(ReturnGameObjectHome, delegateMethodName)
                    ReturnGameObjectHome[delegateMethodName].mockImplementation(() => {})
                    object = new MockGameObject(objectData)
                    ReturnGameObjectHome.return(object)
                });
    
                it(`calls ${delegateMethodName}`, () => {
                    expect(ReturnGameObjectHome[delegateMethodName]).toHaveBeenCalledWith(object)
                });
            });
        })

        describe("returning an unknown object type", () => {
            it("throws an error", () => {
                const unknownObject = new MockGameObject({ templateMetadata: "unknown.thing:fiz.bit/wiz.tot" })
                expect(() => ReturnGameObjectHome.return(unknownObject)).toThrow()
            });
        });
    });

    describe("#returnPlayerUnit", () => {
        let unitObject
        let dreadnoughtBag

        beforeEach(() => {
            dreadnoughtBag  = new MockContainer({
                templateMetadata: "bag.unit:base/dreadnought",
                owningPlayerSlot: 4,
            })
            unitObject = new MockGameObject({
                templateMetadata: "unit:base/dreadnought",
                owningPlayerSlot: 4,
            });

            jest.spyOn(dreadnoughtBag, "addObjects")
            jest.spyOn(GameObjectFinder, "getPlayerUnitBag")

            GameObjectFinder.getPlayerUnitBag.mockReturnValue(dreadnoughtBag)

            ReturnGameObjectHome.return(unitObject)
        });

        it("gets the unit bag via GameObjectFinder.getPlayerUnitBag", () => {
            expect(GameObjectFinder.getPlayerUnitBag).toHaveBeenCalledWith(4, "unit:base/dreadnought")
        });

        it("adds the unit to the correct container", () => {
            expect(dreadnoughtBag.addObjects).toHaveBeenCalledWith([unitObject])
        });
    });
});
