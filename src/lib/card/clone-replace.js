const { world } = require("../../wrapper/api");

class CloneReplace {
    constructor() {
        throw new Error("static only");
    }

    /**
     * Replace a card (might be a stack) with a copy of itself.
     *
     * Cards sometimes appear with the wrong image (as the first image in
     * the deck).  That may be due to forming the deck and deleting cards
     * same frame.  Pulling the card from the hand and putting it back
     * seems to fix it.  Try making a copy to see if that resets it.
     *
     * This MIGHT have been an issue with two cards at the same location,
     * and a physics cast found the wrong one.  MAYBE.  Leave it be for now.
     *
     * @param {Card} card
     * @returns {Card}
     */
    static cloneReplace(card) {
        if (world.__isMock) {
            return card;
        }

        const json = card.toJSONString();
        const above = card.getPosition().add([0, 0, 5]);
        card.setTags(["DELETED_ITEMS_IGNORE"]);
        card.destroy();
        card = world.createObjectFromJSON(json, above);
        return card;
    }
}

module.exports = { CloneReplace };
