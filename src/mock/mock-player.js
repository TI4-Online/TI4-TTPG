class Player {
    constructor(data) {
        this._name = (data && data.name) || "";
        this._playerColor = (data && data.playerColor) || "?";
        this._selectedObjects = (data && data.selectedObjects) || [];
        this._slot = (data && data.slot) || 0;
    }

    setName(name) {
        this._name = name;
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

    setHandHolder(cardHolder) {}

    switchSlot(slot) {
        this._slot = slot;
    }

    setPositionAndRotation() {}

    sendChatMessage(message, color) {}

    showMessage(message) {}
}

module.exports = Player;
