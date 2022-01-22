class MockPlayer {
    constructor(data) {
        this._playerColor = data && data.playerColor || '?'
        this._selectedObjects = data && data.selectedObjects || []
    }

    getPlayerColor() {
        return this._playerColor
    }

    getSelectedObjects() {
        return this._selectedObjects
    }
}

module.exports = {
    Player : MockPlayer,
    MockPlayer
}