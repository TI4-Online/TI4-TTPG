class Player {
    constructor(data) {
        this._playerColor = (data && data.playerColor) || "?";
        this._selectedObjects = (data && data.selectedObjects) || [];
        this._slot = (data && data.slot) || 0;
    }

    getPlayerColor() {
        return this._playerColor;
    }

    getSelectedObjects() {
        return this._selectedObjects;
    }

    getSlot() {
        return this._slot;
    }
}

module.exports = Player;
