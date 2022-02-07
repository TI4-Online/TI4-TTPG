const GameObject = require("./mock-game-object");

class Dice extends GameObject {
    constructor(data) {
        super(data);
        this._currentFaceIndex = (data && data.currentFaceIndex) || 0;
    }

    getCurrentFaceIndex() {
        return this._currentFaceIndex;
    }

    roll() {}

    setCurrentFace(index) {
        this._currentFaceIndex = index;
    }
}

module.exports = Dice;
