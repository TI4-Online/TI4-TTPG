const assert = require("assert");
const { ObjectNamespace } = require("../../lib/object-namespace");
const { UnitAttrs } = require("../../lib/unit/unit-attrs");
const {
    MockCard,
    MockCardDetails,
    MockContainer,
    MockGameObject,
    world,
} = require("../../mock/mock-api");
const { GatherGenericPlayer } = require("./gather");

it("isGenericTechCardNsid", () => {
    assert(
        GatherGenericPlayer.isGenericTechCardNsid(
            "card.technology.yellow:base/graviton_laser_system"
        )
    );
    assert(
        !GatherGenericPlayer.isGenericTechCardNsid(
            "card.technology.yellow.yin:base/impulse_core"
        )
    );
});

it("gatherTechnologyCards", () => {
    const singletondNsids = [
        "card.technology.yellow.xxcha:base/nullification_field",
        "card.technology.yellow.yin:base/impulse_core",
        "card.technology.yellow:base/graviton_laser_system",
    ];
    const deckNsids = [
        "card.technology.unit_upgrade:base/carrier_2",
        "card.technology.unit_upgrade.sol:base/advanced_carrier_2",
    ];

    // Add singleon cards.
    for (const nsid of singletondNsids) {
        world.__addObject(
            new MockCard({
                cardDetails: new MockCardDetails({ metadata: nsid }),
            })
        );
    }

    // Add a deck with multiple cards.
    world.__addObject(
        new MockCard({
            allCardDetails: deckNsids.map(
                (nsid) => new MockCardDetails({ metadata: nsid })
            ),
            stackSize: deckNsids.length,
        })
    );
    assert.equal(world.getAllObjects().length, 4);

    try {
        const techCards = GatherGenericPlayer.gatherTechnologyCards();
        const nsids = techCards.map((obj) => ObjectNamespace.getNsid(obj));
        assert(
            nsids.includes("card.technology.yellow:base/graviton_laser_system")
        );
        assert(nsids.includes("card.technology.unit_upgrade:base/carrier_2"));
        assert.equal(techCards.length, 2);
    } finally {
        world.__clear();
    }
});

it("gatherUnitsAndBags", () => {
    const objNsids = [];
    const bagNsids = [];
    for (const unit of UnitAttrs.getAllUnitTypes()) {
        objNsids.push("unit:whatever/" + unit);
        bagNsids.push("bag.unit:whatever/" + unit);
    }
    for (const nsid of objNsids) {
        world.__addObject(new MockGameObject({ templateMetadata: nsid }));
    }
    for (const nsid of bagNsids) {
        world.__addObject(new MockContainer({ templateMetadata: nsid }));
    }
    try {
        const bagsWithUnits = GatherGenericPlayer.gatherUnitsAndBags();
        assert.equal(bagsWithUnits.length, objNsids.length + bagNsids.length);
    } finally {
        world.__clear();
    }
});

it("gatherTokenSupplyContainers", () => {
    const bagNsids = ["bag.token:base/fighter_1", "bag.unit:base/fighter"];
    for (const nsid of bagNsids) {
        world.__addObject(new MockContainer({ templateMetadata: nsid }));
    }
    try {
        const tokenContainers =
            GatherGenericPlayer.gatherTokenSupplyContainers();
        const nsids = tokenContainers.map((obj) =>
            ObjectNamespace.getNsid(obj)
        );
        assert.equal(nsids.length, 1);
        assert.equal(nsids[0], "bag.token:base/fighter_1");
    } finally {
        world.__clear();
    }
});

it("gatherSheets", () => {
    const objNsids = ["sheet:base/command", "bag.unit:base/fighter"];
    for (const nsid of objNsids) {
        world.__addObject(new MockGameObject({ templateMetadata: nsid }));
    }
    try {
        const sheets = GatherGenericPlayer.gatherSheets();
        const nsids = sheets.map((obj) => ObjectNamespace.getNsid(obj));
        assert.equal(nsids.length, 1);
        assert.equal(nsids[0], "sheet:base/command");
    } finally {
        world.__clear();
    }
});
