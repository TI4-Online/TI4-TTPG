const assert = require("assert");
const { ReplaceObjects } = require("./replace-objects");
const {
    MockCard,
    MockCardDetails,
    MockGameObject,
    world,
} = require("../../wrapper/api");
const { ObjectNamespace } = require("../../lib/object-namespace");

it("static getReplacedObjects", () => {
    world.__clear();

    const addNsids = [
        "tile.strategy:base/construction", // replaced by :pok
        "tile.strategy:pok/construction", // replaces :base
        "tile.strategy:base/leadership", // inert
    ];
    for (const addNsid of addNsids) {
        world.__addObject(
            new MockGameObject({
                templateMetadata: addNsid,
            })
        );
    }

    // Add a deck.
    const cardNsids = [
        "card.promissory.winnu:base/acquiescence", // REPLACE
        "card.promissory.winnu:base/acquiescence.omega", // REPLACEMENT
        "card.promissory.yin:base/greyfire_mutagen", // (original, but missing replacement)
        "card.promissory.letnev:base/war_funding.omega", // (replacment, but no original)
    ];
    world.__addObject(
        new MockCard({
            allCardDetails: cardNsids.map(
                (nsid) => new MockCardDetails({ metadata: nsid })
            ),
            stackSize: cardNsids.length,
        })
    );

    const replacedObjects = ReplaceObjects.getReplacedObjects();
    const nsids = replacedObjects.map((obj) => ObjectNamespace.getNsid(obj));
    world.__clear();
    assert.equal(nsids.length, 2);
    assert(nsids.includes("tile.strategy:base/construction"));
    assert(nsids.includes("card.promissory.winnu:base/acquiescence"));
});
