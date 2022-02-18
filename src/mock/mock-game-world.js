const assert = require("assert");
const Dice = require("./mock-dice");
const GameObject = require("./mock-game-object");
const Player = require("./mock-player");
const UIElement = require("./mock-ui-element");

class GameWorld {
    constructor(data) {
        this._allObjects = data ? data.allObjects : [];
        this._allPlayers = data ? data.allPlayers : [];
        this._tableHeight = data ? data.tableHeight : 1;
        this._savedData = data ? data.savedData : "";
        this._uis = data && data.uis ? data.uis : [];
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

    __setPlayers(players) {
        assert(Array.isArray(players));
        players.forEach((player) => assert(player instanceof Player));
        this._allPlayers = players;
    }

    __clear() {
        this._allObjects = [];
        this._allPlayers = [];
        this._uis = [];
    }

    static getExecutionReason() {
        return "ScriptReload";
    }

    addUI(uiElement) {
        assert(uiElement instanceof UIElement);
        this._uis.push(uiElement);
    }

    createObjectFromTemplate(templateId, position) {
        let result;
        if (templateId === "9065AC5141F87F8ADE1F5AB6390BBEE4") {
            result = new Dice();
        } else {
            result = new GameObject();
        }
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

    getUIs() {
        return this._uis;
    }

    lineTrace(src, dst) {
        // Return any exact matches.
        const result = [];
        for (const obj of this._allObjects) {
            if (
                obj.getPosition().x === src.x &&
                obj.getPosition().y === src.y
            ) {
                result.push({
                    object: obj,
                });
            }
        }
        return result;
    }

    removeUI(index) {
        this._uis.splice(index, 1);
    }

    removeUIElement(uiElement) {
        assert(uiElement instanceof UIElement);
        this._uis.splice(this._uis.indexOf(uiElement), 1);
    }

    setSavedData(value) {
        assert(typeof value === "string");
        assert(value.length < 1024);
        this._savedData = value;
    }

    updateUI(uiElement) {
        assert(uiElement instanceof UIElement);
    }
}

module.exports = GameWorld;
