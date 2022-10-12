require("../../../global");
const assert = require("assert");
const { TabSecrets } = require("./tab-secrets");
const {
    MockCard,
    MockCardDetails,
    MockCardHolder,
    Widget,
    world,
} = require("../../../wrapper/api");

it("constructor", () => {
    new TabSecrets();
});

it("getUI", () => {
    const widget = new TabSecrets().getUI();
    assert(widget instanceof Widget);
});

it("getAllSecretNames", () => {
    world.__clear();

    const a = new MockCard({
        allCardDetails: [
            new MockCardDetails({
                metadata: "card.objective.secret:base/a",
                name: "a",
            }),
        ],
    });
    const b = new MockCard({
        allCardDetails: [
            new MockCardDetails({
                metadata: "card.objective.secret:base/b",
                name: "b",
            }),
        ],
    });
    const c = new MockCard({
        allCardDetails: [
            new MockCardDetails({
                metadata: "card.objective.secret:base/c",
                name: "c",
            }),
        ],
    });
    world.__addObject(b);
    world.__addObject(a);
    world.__addObject(c);

    const names = TabSecrets.getAllSecretNames();
    assert.deepEqual(names, ["a", "b", "c"]);

    world.__clear();
});

it("getScoredSecretNames", () => {
    world.__clear();

    const playerHolder = new MockCardHolder({ owningPlayerSlot: 1 });
    const anonymousHolder = new MockCardHolder({ owningPlayerSlot: -1 });

    const a = new MockCard({
        allCardDetails: [
            new MockCardDetails({
                metadata: "card.objective.secret:base/a",
                name: "a",
            }),
        ],
        holder: playerHolder,
    });
    const b = new MockCard({
        allCardDetails: [
            new MockCardDetails({
                metadata: "card.objective.secret:base/b",
                name: "b",
            }),
        ],
        holder: anonymousHolder,
    });
    world.__addObject(a);
    world.__addObject(b);

    const names = TabSecrets.getScoredSecretNames();
    assert.deepEqual(names, ["b"]);

    world.__clear();
});
