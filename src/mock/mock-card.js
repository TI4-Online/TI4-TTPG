const GameObject = require("./mock-game-object");
const MockCardDetails = require("./mock-card-details");

class Card extends GameObject {
    constructor(data) {
        super(data);
        this._allCardDetails = (data && data.allCardDetails) || [new MockCardDetails()];
        this._cardDetails = (data && data.cardDetails) || new MockCardDetails();
        this._stackSize = (data && data._stackSize) || 1;
        this._faceUp = data && data.faceUp !== undefined ? data.faceUp : true;
    }

    getCardDetails() {
        return this._cardDetails;
    }

    getAllCardDetails() {
        return this._allCardDetails
    }

    getStackSize() {
        return this._stackSize;
    }

    isFaceUp() {
        return this._faceUp;
    }
}

module.exports = Card;
