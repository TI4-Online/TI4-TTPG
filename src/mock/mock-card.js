const GameObject = require("./mock-game-object");
const MockCardDetails = require("./mock-card-details");

class Card extends GameObject {
    constructor(data) {
        super(data);
        this._cardDetails = (data && data.cardDetails) || new MockCardDetails();
        this._faceUp = data && data.faceUp !== undefined ? data.faceUp : true;
    }

    getCardDetails() {
        return this._cardDetails;
    }

    isFaceUp() {
        return this._faceUp;
    }
}

module.exports = Card;
