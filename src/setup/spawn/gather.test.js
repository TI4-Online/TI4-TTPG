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
    world.__clear();

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

    const found = Gather.gather((nsid) => true);
    world.__clear();
    assert.equal(found.length, 7);
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
    assert.equal(
        Gather.isFactionTechCardNsid(
            "card.technology.unit_upgrade.arborec:base/letani_warrior_2"
        ),
        "arborec"
    );
});

it("isCard", () => {
    assert(!Gather.isCardNsid("toke:base/fighter_1"));
    assert.equal(Gather.isCardNsid("card.action:base/whatever"), "action");
    assert.equal(
        Gather.isCardNsid("card.objective.secret:base/whatever"),
        "objective.secret"
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

it("isTableTokenOrTokenBag", () => {
    assert(Gather.isTableTokenOrTokenBag("token:pok/frontier"));
    assert(Gather.isTableTokenOrTokenBag("bag.token:pok/frontier"));
    assert(
        Gather.isTableTokenOrTokenBag(
            "token.attachment.exploration:pok/tomb_of_emphidia"
        )
    );
    assert(!Gather.isTableTokenOrTokenBag("bag.token:base/fighter_1"));
    assert(!Gather.isTableTokenOrTokenBag("bag.unit:base/fighter"));
});

it("isCoreSheet", () => {
    assert(Gather.isCoreSheet("sheet:base/command"));
    assert(Gather.isCoreSheet("sheet:pok/leader"));
    assert(!Gather.isCoreSheet("bag.token:base/fighter_1"));
    assert(!Gather.isCoreSheet("bag.unit:base/fighter"));
});

it("isFactionPromissoryNsid", () => {
    assert.equal(
        Gather.isFactionPromissoryNsid("card.promissory.saar:base/raghs_call"),
        "saar"
    );
    assert.equal(
        Gather.isFactionPromissoryNsid(
            "card.promissory.orange:base/support_for_the_throne"
        ),
        "orange"
    );
    assert(
        !Gather.isFactionPromissoryNsid(
            "card.leader.commander.winnu:pok/rickar_rickani"
        )
    );
});

it("isFactionLeaderNsid", () => {
    assert.equal(
        Gather.isFactionLeaderNsid(
            "card.leader.commander.winnu:pok/rickar_rickani"
        ),
        "winnu"
    );
    assert(!Gather.isFactionLeaderNsid("unit:base/fighter"));
});

it("isFactionAlliance", () => {
    assert.equal(Gather.isFactionAlliance("card.alliance:base/norr"), "norr");
    assert(!Gather.isFactionAlliance("unit:base/fighter"));
});

it("isFactionReference", () => {
    assert.equal(
        Gather.isFactionReference("card.faction_reference:base/winnu"),
        "winnu"
    );
    assert(!Gather.isFactionReference("unit:base/fighter"));
});

it("isFactionTokenCard", () => {
    assert.equal(
        Gather.isFactionTokenCard("card.faction_token:base/arborec"),
        "arborec"
    );
    assert(!Gather.isFactionTokenCard("unit:base/fighter"));
});

it("isFactionToken", () => {
    assert.equal(
        Gather.isFactionToken("token.command:base/arborec"),
        "arborec"
    );
    assert.equal(
        Gather.isFactionToken("token.control:base/arborec"),
        "arborec"
    );
    assert(!Gather.isFactionToken("unit:base/fighter"));
});
