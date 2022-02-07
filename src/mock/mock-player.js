class Player {
    constructor(data) {
        this._name = (data && data.name) || "";
        this._playerColor = (data && data.playerColor) || "?";
        this._selectedObjects = (data && data.selectedObjects) || [];
        this._slot = (data && data.slot) || 0;
    }

    getName() {
        return this._name;
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

    sendChatMessage(message, color) {}

    showMessage(message) {}
}

module.exports = Player;
