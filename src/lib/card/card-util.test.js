const assert = require("assert");
const { CardUtil } = require("./card-util");
const { MockCard, MockCardDetails, world } = require("../../wrapper/api");

it("isLooseCard", () => {
    const faceUp = new MockCard({ faceUp: true });
    const faceDown = new MockCard({ faceUp: false });
    assert(CardUtil.isLooseCard(faceUp));
    assert(!CardUtil.isLooseCard(faceDown));
});

it("takeCards", () => {
    world.__clear();
    world.__addObject(
        new MockCard({
            allCardDetails: [
                new MockCardDetails({
                    metadata: "card.action:base/experimental_battlestation",
                }),
            ],
        })
    );
    const cards = CardUtil.gatherCards((nsid, card) => {
        return nsid === "card.action:base/experimental_battlestation";
    });
    world.__clear();
    assert.equal(cards.length, 1);
});
