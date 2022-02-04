const assert = require("../wrapper/assert");
const GameObject = require("./mock-game-object");

class GameWorld {
    constructor(data) {
        this._allObjects = data ? data.allObjects : [];
        this._allPlayers = data ? data.allPlayers : [];
        this._tableHeight = data ? data.tableHeight : 1;
    }

    get __isMock() {
        return true;
    }

    __addObject(gameObject) {
        assert(gameObject instanceof GameObject);
        this._allObjects.push(gameObject);
    }

    __removeObject(gameObject) {
        assert(gameObject instanceof GameObject);
        this._allObjects = this._allObjects.filter((obj) => obj != gameObject);
    }

    __clear() {
        this._allObjects = [];
    }

    static getExecutionReason() {
        return "ScriptReload";
    }

    // TTPG exposes this both static and per-instance.
    getExecutionReason() {
        return GameWorld.getExecutionReason();
    }

    getAllObjects() {
        return this._allObjects;
    }

    getAllPlayers() {
        return this._allPlayers;
    }

    getTableHeight() {
        return this._tableHeight;
    }
}

module.exports = GameWorld;
