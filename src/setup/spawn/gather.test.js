const assert = require("assert");
const { ObjectNamespace } = require("../../lib/object-namespace");
const {
    MockCard,
    MockCardDetails,
    MockGameObject,
    world,
} = require("../../mock/mock-api");
const { Gather } = require("./gather");

it("sortByNsid", () => {
    const nsids = [
        "unit:pok/mech",
        "unit:base/fighter",
        "unit:base/destroyer",
        "unit:base/war_sun",
    ];
    const objs = nsids.map(
        (nsid) => new MockGameObject({ templateMetadata: nsid })
    );
    const result = Gather.sortByNsid(objs);
    const resultNsids = result.map((obj) => ObjectNamespace.getNsid(obj));
    assert.deepEqual(resultNsids, [
        "unit:base/destroyer",
        "unit:base/fighter",
        "unit:pok/mech",
        "unit:base/war_sun",
    ]);
});

it("gather", () => {
    const looseNsids = [
        "tile.strategy:base/construction", // replaced by :pok
        "tile.strategy:pok/construction", // replaces :base
        "tile.strategy:base/leadership", // inert
    ];
    for (const nsid of looseNsids) {
        world.__addObject(
            new MockGameObject({
                templateMetadata: nsid,
            })
        );
    }

    // Add a deck.
    const deckNsids = [
        "card.promissory.winnu:base/acquiescence", // REPLACE
        "card.promissory.winnu:base/acquiescence.omega", // REPLACEMENT
        "card.promissory.yin:base/greyfire_mutagen", // (original, but missing replacement)
        "card.promissory.letnev:base/war_funding.omega", // (replacment, but no original)
    ];
    world.__addObject(
        new MockCard({
            allCardDetails: deckNsids.map(
                (nsid) => new MockCardDetails({ metadata: nsid })
            ),
            stackSize: deckNsids.length,
        })
    );

    try {
        const found = Gather.gather((nsid) => true);
        assert.equal(found.length, 7);
    } finally {
        world.__clear();
    }
});

it("isGenericTechCardNsid", () => {
    assert(
        Gather.isGenericTechCardNsid(
            "card.technology.yellow:base/graviton_laser_system"
        )
    );
    assert(
        !Gather.isGenericTechCardNsid(
            "card.technology.yellow.yin:base/impulse_core"
        )
    );
});

it("isFactionTechCardNsid", () => {
    assert(
        !Gather.isFactionTechCardNsid(
            "card.technology.yellow:base/graviton_laser_system"
        )
    );
    assert.equal(
        Gather.isFactionTechCardNsid(
            "card.technology.yellow.yin:base/impulse_core"
        ),
        "yin"
    );
});

it("isUnitOrUnitBag", () => {
    assert(!Gather.isUnitOrUnitBag("token:base/fighter_1"));
    assert(Gather.isUnitOrUnitBag("unit:base/fighter"));
    assert(!Gather.isUnitOrUnitBag("bag.token:base/fighter_1"));
    assert(Gather.isUnitOrUnitBag("bag.unit:base/fighter"));
});

it("isCoreTokenOrTokenBag", () => {
    assert(Gather.isCoreTokenOrTokenBag("token:base/fighter_1"));
    assert(!Gather.isCoreTokenOrTokenBag("unit:base/fighter"));
    assert(Gather.isCoreTokenOrTokenBag("bag.token:base/fighter_1"));
    assert(!Gather.isCoreTokenOrTokenBag("bag.unit:base/fighter"));
});

it("isCoreSheet", () => {
    assert(Gather.isCoreSheet("sheet:base/command"));
    assert(Gather.isCoreSheet("sheet:pok/leader"));
    assert(!Gather.isCoreSheet("bag.token:base/fighter_1"));
    assert(!Gather.isCoreSheet("bag.unit:base/fighter"));
});
