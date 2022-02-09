const { Border } = require("../../wrapper/api");

class StrategyCardBorder extends Border {
    getCard() {
        return this._card;
    }

    getPlayer() {
        return this._player;
    }

    getUI() {
        return this._ui;
    }

    setCard(value) {
        this._card = value;
    }

    setPlayer(value) {
        this._player = value;
    }

    setUI(value) {
        this._ui = value;
    }
}

module.exports = {
    StrategyCardBorder,
};
