const GameObject = require("./mock-game-object");

class Dice extends GameObject {
    constructor(data) {
        super(data);
    }

    roll() {}
}

module.exports = Dice;
