const TriggerableMulticastDelegate = require("../lib/triggerable-multicast-delegate");
const Vector = require("./mock-vector");
const Rotator = require("./mock-rotator");

let _nextId = 1;

class GameObject {
    constructor(data) {
        this._container = (data && data.container) || undefined;
        this._id = (data && data.id) || "abcd" + _nextId++;
        this._isValid = true;
        this._name = (data && data.name) || "";
        this._owningPlayerSlot = (data && data.owningPlayerSlot) || -1;
        this._position = (data && data.position) || new Vector(0, 0, 0);
        this._primaryColor = data && data.primaryColor;
        this._rotation = (data && data.rotation) || new Rotator(0, 0, 0);
        this._savedData = (data && data.savedData) || "";
        this._templateId = (data && data.templateId) || "";
        this._templateMetadata = (data && data.templateMetadata) || "";
        this._uis = (data && data.uis) || [];
        this._customActions = (data && data.customActions) || [];
    }

    onCreated = new TriggerableMulticastDelegate();
    onCustomAction = new TriggerableMulticastDelegate();
    onDestroyed = new TriggerableMulticastDelegate();
    onGrab = new TriggerableMulticastDelegate();
    onHit = new TriggerableMulticastDelegate();
    onMovementStopped = new TriggerableMulticastDelegate();
    onNumberAction = new TriggerableMulticastDelegate();
    onPrimaryAction = new TriggerableMulticastDelegate();
    onReleased = new TriggerableMulticastDelegate();
    onReset = new TriggerableMulticastDelegate();
    onSecondaryAction = new TriggerableMulticastDelegate();
    onSnapped = new TriggerableMulticastDelegate();
    onTick = new TriggerableMulticastDelegate();

    addCustomAction(customAction) {
        this._customActions.push(customAction);
    }

    destroy() {
        this._isValid = false;
        this.onDestroyed.trigger(this);
    }

    getContainer() {
        return this._container;
    }

    getId() {
        return this._id;
    }

    getName() {
        return this._name;
    }

    getOwningPlayerSlot() {
        return this._owningPlayerSlot;
    }

    getPosition() {
        return this._position;
    }

    getPrimaryColor() {
        return this._primaryColor;
    }

    setPrimaryColor(value) {
        this._primaryColor = value;
    }

    getRotation() {
        return this._rotation;
    }

    getSavedData() {
        return this._savedData;
    }

    getTemplateId() {
        return this._templateId;
    }

    getTemplateMetadata() {
        return this._templateMetadata;
    }

    addUI(ui) {
        this._uis.push(ui);
        ui._owningObject = this;
    }

    getUIs() {
        return this._uis;
    }

    isValid() {
        return this._isValid;
    }

    setName(value) {
        this._name = value;
    }

    setOwningPlayerSlot(value) {
        this._owningPlayerSlot = value;
    }

    setPosition(position) {
        this._position = position;
    }

    setSavedData(value) {
        this._savedData = value;
    }
}

module.exports = GameObject;
