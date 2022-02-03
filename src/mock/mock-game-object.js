const TriggerableMulticastDelegate = require("../lib/triggerable-multicast-delegate");
const Vector = require("./mock-vector");
const Rotator = require("./mock-rotator");

class GameObject {
    constructor(data) {
        this._container = (data && data.container) || undefined;
        this._id = (data && data.id) || "abcd";
        this._owningPlayerSlot = (data && data.owningPlayerSlot) || -1;
        this._position = (data && data.position) || new Vector(0, 0, 0);
        this._primaryColor = data && data.primaryColor;
        this._rotation = (data && data.rotation) || new Rotator(0, 0, 0);
        this._savedData = (data && data.savedData) || "";
        this._templateMetadata = (data && data.templateMetadata) || "";
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

    getContainer() {
        return this._container;
    }

    getId() {
        return this._id;
    }

    getOwningPlayerSlot() {
        return this._owningPlayerSlot;
    }

    setOwningPlayerSlot(value) {
        this._owningPlayerSlot = value;
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

    setSavedData(value) {
        this._savedData = value;
    }

    getTemplateMetadata() {
        return this._templateMetadata;
    }
}

module.exports = GameObject;
