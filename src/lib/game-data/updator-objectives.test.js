require("../../global"); // register world.TI4
const assert = require("assert");
const UPDATOR = require("./updator-objectives");
const {
    MockCard,
    MockCardDetails,
    MockCardHolder,
    MockGameObject,
    world,
} = require("../../wrapper/api");

it("objectives (token)", () => {
    const playerDesks = world.TI4.getAllPlayerDesks();
    const data = {
        players: playerDesks.map((desk) => {
            return { color: desk.colorName };
        }),
    };

    world.__clear();
    world.__addObject(
        new MockCard({
            allCardDetails: [
                new MockCardDetails({
                    name: "Amass Wealth",
                    metadata: "card.objective.public_1:pok/amass_wealth",
                }),
            ],
        })
    );
    world.__addObject(
        new MockGameObject({
            templateMetadata: "token.control:base/arborec",
            owningPlayerSlot: playerDesks[0].playerSlot,
        })
    );
    UPDATOR(data);
    world.__clear();

    assert.deepEqual(data.objectives, {
        Agenda: [],
        Other: [],
        "Public Objectives I": ["Amass Wealth"],
        "Public Objectives II": [],
        Relics: [],
        "Secret Objectives": [],
    });
    assert.deepEqual(data.players[0].objectives, ["Amass Wealth"]);
});

it("objectives (holder)", () => {
    const playerDesks = world.TI4.getAllPlayerDesks();
    const data = {
        players: playerDesks.map((desk) => {
            return { color: desk.colorName };
        }),
    };

    const holder = new MockCardHolder({
        savedData: `{"deskIndex":"${playerDesks[0].index}"}`,
    });

    world.__clear();
    world.__addObject(
        new MockCard({
            allCardDetails: [
                new MockCardDetails({
                    name: "Become a Martyr",
                    metadata: "card.objective.secret:pok/become_a_martyr",
                }),
            ],
            holder: holder,
        })
    );
    world.__addObject(
        new MockCard({
            allCardDetails: [
                new MockCardDetails({
                    name: "Support for the Throne (Blue)",
                    metadata:
                        "card.promissory.blue:base/support_for_the_throne",
                }),
            ],
            holder: holder,
        })
    );
    world.__addObject(
        new MockCard({
            allCardDetails: [
                new MockCardDetails({
                    name: "Shard of the Throne (PoK)",
                    metadata: "card.relic:pok/shard_of_the_throne",
                }),
            ],
            holder: holder,
        })
    );
    UPDATOR(data);
    world.__clear();

    assert.deepEqual(data.objectives, {
        Agenda: [],
        Other: ["Support for the Throne (Blue)"],
        "Public Objectives I": [],
        "Public Objectives II": [],
        Relics: ["Shard of the Throne"],
        "Secret Objectives": ["Become a Martyr"],
    });
    assert.deepEqual(data.players[0].objectives, [
        "Become a Martyr",
        "Shard of the Throne",
        "Support for the Throne (Blue)",
    ]);
});

it("strip off omega", () => {
    // overlay does not recognize omega objective names, strip the suffix
    const playerDesks = world.TI4.getAllPlayerDesks();
    const data = {
        players: playerDesks.map((desk) => {
            return { color: desk.colorName };
        }),
    };

    const holder = new MockCardHolder({
        savedData: `{"deskIndex":"${playerDesks[0].index}"}`,
    });

    world.__clear();
    world.__addObject(
        new MockCard({
            allCardDetails: [
                new MockCardDetails({
                    name: "Fight with Precision Ω",
                    metadata:
                        "card.objective.secret:codex.vigil/fight_with_precision.omega",
                }),
            ],
            holder: holder,
        })
    );
    UPDATOR(data);
    world.__clear();

    assert.deepEqual(data.objectives, {
        Agenda: [],
        Other: [],
        "Public Objectives I": [],
        "Public Objectives II": [],
        Relics: [],
        "Secret Objectives": ["Fight with Precision"],
    });
    assert.deepEqual(data.players[0].objectives, ["Fight with Precision"]);
});
