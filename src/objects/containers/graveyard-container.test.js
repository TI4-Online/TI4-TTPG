const { MockGameObject, MockContainer } = require("../../mock/mock-api");
const GraveyardContainer = require("./graveyard-container");
const ReturnGameObjectHome = require("../../lib/return-game-object-home");

describe("GraveyardContainer", () => {
    let refContainer
    
    beforeEach(() => {
        refContainer = new MockContainer()
        new GraveyardContainer(refContainer)
    });

    describe("inserting objects", () => {
        let insertedObjects

        beforeEach(() => {
            jest.spyOn(ReturnGameObjectHome, "returnAll")
            insertedObjects = [
                new MockGameObject({ id: "token.command:base/arborec" }),
                new MockGameObject({ id: "token.vuilraith:pok/tear.nekro" }),
            ]
            refContainer.onInserted.trigger(refContainer, insertedObjects)
        });
        
        it("calls ReturnGameObjectHome on each insterted game object", () => {
            expect(ReturnGameObjectHome.returnAll).toHaveBeenCalledWith(insertedObjects)
        });
    });
});
