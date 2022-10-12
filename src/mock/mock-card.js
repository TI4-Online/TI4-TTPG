const GameObject = require("./mock-game-object");
const MockCardDetails = require("./mock-card-details");

class Card extends GameObject {
    static __create(nsid, position) {
        return new Card({
            position,
            allCardDetails: [new MockCardDetails({ metadata: nsid })],
        });
    }

    constructor(data) {
        super(data);
        this._allCardDetails = (data && data.allCardDetails) || [];
        this._holder = data && data.holder;
        this._stackSize = (data && data.stackSize) || 1;
        this._faceUp = data && data.faceUp !== undefined ? data.faceUp : true;

        if (this._allCardDetails.length == 0) {
            if (data && data.cardDetails) {
                this._allCardDetails.push(data.cardDetails);
            } else {
                this._allCardDetails.push(new MockCardDetails());
            }
        }
    }

    getCardDetails(index) {
        return this._allCardDetails[index || 0];
    }

    getAllCardDetails() {
        return this._allCardDetails;
    }

    getHolder() {
        return this._holder;
    }

    getStackSize() {
        return this._stackSize;
    }

    isInHolder() {
        return this._holder ? true : false;
    }

    isFaceUp() {
        return this._faceUp;
    }

    takeCards(numCards, fromFront, offset) {
        const allCardDetails = [];
        for (let i = offset; i < offset + numCards; i++) {
            allCardDetails.push(this.getCardDetails(i));
        }
        return new Card({
            allCardDetails,
            cardDetails: allCardDetails[0],
            stackSize: allCardDetails.length,
        });
    }
}

module.exports = Card;
