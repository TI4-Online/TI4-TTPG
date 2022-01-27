class GameWorld {
    constructor(data) {
        this._allObjects = data ? data.allObjects : []
    }

    static getExecutionReason() {
        return 'ScriptReload'
    }

    // TTPG exposes this both static and per-instance.
    getExecutionReason() {
        return GameWorld.getExecutionReason()
    }

    getAllObjects() {
        return this._allObjects
    }
}

module.exports = GameWorld
