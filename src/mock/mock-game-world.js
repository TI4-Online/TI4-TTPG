const assert = require("../wrapper/assert");
const GameObject = require("./mock-game-object");
const UIElement = require("./mock-ui-element");

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

    addUI(uiElement) {
        assert(uiElement instanceof UIElement);
        // nop
    }

    getAllObjects() {
        return this._allObjects;
    }

    getAllPlayers() {
        return this._allPlayers;
    }

    getPlayerBySlot(playerSlot) {
        assert(typeof playerSlot === "number");
        for (const player of this.getAllPlayers()) {
            if (player.getSlot() === playerSlot) {
                return player;
            }
        }
        return undefined;
    }

    getTableHeight() {
        return this._tableHeight;
    }

    removeUI(uiElement) {
        assert(uiElement instanceof UIElement);
        // nop
    }
}

module.exports = GameWorld;
