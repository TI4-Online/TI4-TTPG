const assert = require("../wrapper/assert");
const GameObject = require("./mock-game-object");

class GameWorld {
    constructor(data) {
        this._allObjects = data ? data.allObjects : [];
    }

    __addObject(gameObject) {
        assert(gameObject instanceof GameObject);
        this._allObjects.push(gameObject);
    }

    __removeObject(gameObject) {
        assert(gameObject instanceof GameObject);
        this._allObjects = this._allObjects.filter((obj) => obj != gameObject);
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
}

module.exports = GameWorld;
