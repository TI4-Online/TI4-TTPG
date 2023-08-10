const assert = require("../wrapper/assert-wrapper");
const Dice = require("./mock-dice");
const CardHolder = require("./mock-card-holder");
const GameObject = require("./mock-game-object");
const Player = require("./mock-player");
const Sound = require("./mock-sound");
const UIElement = require("./mock-ui-element");
const Zone = require("./mock-zone");

class GameWorld {
    constructor(data) {
        this._allObjects = data ? data.allObjects : [];
        this._allPlayers = data ? data.allPlayers : [];
        this._drawingLines = data ? data.drawingLines : [];
        this._savedData = data ? data.savedData : "";
        this._tableHeight = data ? data.tableHeight : 1;
        this._uis = data && data.uis ? data.uis : [];

        this._slotToTeam = {};
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
        this._allObjects.forEach((obj) => {
            obj.destroy(); // mark as not valid
        });
        this._allObjects = [];
        this._allPlayers = [];
        this._drawingLines = [];
        this._uis = [];
    }

    static getExecutionReason() {
        return "ScriptReload";
    }

    addCustomAction() {}

    addDrawingLine(value) {
        this._drawingLines.push(value);
    }

    addScreenUI(screenUIElement) {
        return 0;
    }

    addUI(uiElement) {
        assert(uiElement instanceof UIElement);
        this._uis.push(uiElement);
        return this._uis.length - 1;
    }

    capsuleOverlap() {
        return [];
    }

    createObjectFromJSON(json, position) {
        const result = new GameObject();
        return result;
    }

    createObjectFromTemplate(templateId, position) {
        let result;
        switch (templateId) {
            case "9065AC5141F87F8ADE1F5AB6390BBEE4":
                result = new Dice();
                break;
            case "2E3F63984DBE5B704482D3A732F28BF5":
            case "BFC565AE79373881585937D70241A1DF":
                result = new CardHolder();
                break;
            default:
                result = new GameObject();
        }
        result.setPosition(position);
        return result;
    }

    createZone(position) {
        return new Zone();
    }

    getAllObjects() {
        return this._allObjects;
    }

    getAllTables() {
        return [];
    }

    getAllPlayers() {
        return this._allPlayers;
    }

    getAllZones() {
        return [];
    }

    getDrawingLines() {
        return this._drawingLines;
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

    getSlotTeam(playerSlot) {
        return this._slotToTeam[playerSlot] || 0;
    }

    getTableHeight() {
        return this._tableHeight;
    }

    getUIs() {
        return this._uis;
    }

    importSound(path, packageId, useCache) {
        return new Sound();
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

    nextTurn() {}

    previousTurn() {}

    removeDrawingLine(index) {
        this._drawingLines.splice(index, 1);
    }

    removeDrawingLineObject(value) {
        this._drawingLines = this._drawingLines.filter((x) => {
            return x !== value;
        });
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

    setSlotColor(slot, color) {}

    setSlotTeam(playerSlot, teamNumber) {
        this._slotToTeam[playerSlot] = teamNumber;
    }

    updateScreenUI(screenUIElement) {}

    updateUI(uiElement) {
        assert(uiElement instanceof UIElement);
    }
}

module.exports = GameWorld;
