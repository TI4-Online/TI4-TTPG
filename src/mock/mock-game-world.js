const assert = require("../wrapper/assert");
const GameObject = require("./mock-game-object");
const UIElement = require("./mock-ui-element");

class GameWorld {
    constructor(data) {
        this._allObjects = data ? data.allObjects : [];
        this._allPlayers = data ? data.allPlayers : [];
        this._tableHeight = data ? data.tableHeight : 1;
        this._savedData = data ? data.savedData : "";
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

    addUI(uiElement) {
        assert(uiElement instanceof UIElement);
        // nop
    }

    createObjectFromTemplate(templateId, position) {
        const result = new GameObject();
        result.setPosition(position);
        return result;
    }

    getAllObjects() {
        return this._allObjects;
    }

    getAllPlayers() {
        return this._allPlayers;
    }

    // TTPG exposes this both static and per-instance.
    getExecutionReason() {
        return GameWorld.getExecutionReason();
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

    getSavedData() {
        return this._savedData;
    }

    getTableHeight() {
        return this._tableHeight;
    }

    removeUI(uiElement) {
        assert(uiElement instanceof UIElement);
        // nop
    }

    setSavedData(value) {
        assert(typeof value === "string");
        assert(value.length < 1024);
        this._savedData = value;
    }
}

module.exports = GameWorld;
