const GameObject = require("./mock-game-object");

class CardHolder extends GameObject {
    constructor(data) {
        super(data);
    }

    setHiddenCardsType(value) {}

    setOnlyOwnerTakesCards(value) {}
}

module.exports = CardHolder;
