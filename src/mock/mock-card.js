const GameObject = require('./mock-game-object')
const MockCardDetails = require('./mock-card-details')

class Card extends GameObject {
    constructor(data) {
        super(data)
        this._cardDetails = data && data.cardDetails || new MockCardDetails()
    }

    getCardDetails() {
        return this._cardDetails
    }
}

module.exports = Card