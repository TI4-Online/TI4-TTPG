const TriggerableMulticastDelegate = require("../lib/triggerable-multicast-delegate");
const Vector = require("./mock-vector");
const Rotator = require("./mock-rotator");

let _nextId = 1;

class GameObject {
    static __create(nsid, position) {
        return new GameObject({ templateMetadata: nsid, position });
    }

    constructor(data) {
        this._container = (data && data.container) || undefined;
        this._extent = (data && data.extent) || new Vector(1, 1, 1);
        this._extentCenter = (data && data.extent) || new Vector(0, 0, 0);
        this._isHeld = (data && data.isHeld) || false;
        this._isInHolder = (data && data.isInHolder) || false;
        this._id = (data && data.id) || "abcd" + _nextId++;
        this._isValid = true;
        this._name = (data && data.name) || "";
        this._objectType = (data && data.objectType) || 1;
        this._owningPlayerSlot = (data && data.owningPlayerSlot) || -1;
        this._packageId = (data && data.packageId) || "TI4";
        this._position = (data && data.position) || new Vector(0, 0, 0);
        this._primaryColor = data && data.primaryColor;
        this._rotation = (data && data.rotation) || new Rotator(0, 0, 0);
        this._savedData = (data && data.savedData) || "";
        this._savedDataKeyed = (data && data._savedDataKeyed) || {};
        this._size = (data && data.size) || new Vector(1, 1, 1);
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

    addDrawingLine(value) {}

    addUI(ui) {
        this._uis.push(ui);
        ui._owningObject = this;
    }

    destroy() {
        this._isValid = false;
        this.onDestroyed.trigger(this);
    }

    freeze() {}

    getContainer() {
        return this._container;
    }

    getDrawingLines() {
        return [];
    }

    getExtent() {
        return this._extent;
    }
    getExtentCenter() {
        return this._extentCenter;
    }

    getId() {
        return this._id;
    }

    getName() {
        return this._name;
    }

    getObjectType() {
        return this._objectType;
    }

    getOwningPlayerSlot() {
        return this._owningPlayerSlot;
    }

    getPackageId() {
        return this._packageId;
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

    getSavedData(key) {
        if (key !== undefined) {
            return this._savedDataKeyed[key];
        } else {
            return this._savedData;
        }
    }

    getSize() {
        return this._size;
    }

    getSnappedToPoint() {
        return undefined;
    }

    getTemplateId() {
        return this._templateId;
    }

    getTemplateMetadata() {
        return this._templateMetadata;
    }

    getUIs() {
        return this._uis;
    }

    isHeld() {
        return this._held;
    }

    isInHolder() {
        return this._isInHolder;
    }

    isValid() {
        return this._isValid;
    }

    removeUIElement(uiElement) {
        this._uis = this._uis.filter((ui) => {
            return ui != uiElement;
        });
    }

    setHiddenCardsType(value) {}

    setName(value) {
        this._name = value;
    }

    setObjectType(value) {
        this._objectType = value;
    }

    setOnlyOwnerTakesCards(value) {}

    setOwningPlayerSlot(value) {
        this._owningPlayerSlot = value;
    }

    setPosition(position) {
        this._position = position;
    }

    setRotation(rotation) {
        this._rotation = rotation;
    }

    setSavedData(value, key) {
        if (key !== undefined) {
            this._savedDataKeyed[key] = value;
        } else {
            this._savedData = value;
        }
    }

    snapToGround() {}

    toJSONString() {
        return "{}";
    }

    updateUI(uiElement) {}

    localPositionToWorld(position) {
        if (Array.isArray(position)) {
            position = new Vector(position[0], position[1], position[2]);
        }
        if (!(position instanceof Vector)) {
            position = new Vector(
                position.x || 0,
                position.y || 0,
                position.z || 0
            );
        }
        return position.add(this._position); // does not account for rotation
    }

    worldPositionToLocal(position) {
        if (Array.isArray(position)) {
            position = new Vector(position[0], position[1], position[2]);
        }
        if (!(position instanceof Vector)) {
            position = new Vector(
                position.x || 0,
                position.y || 0,
                position.z || 0
            );
        }
        return position.subtract(this._position); // does not account for rotation
    }

    localRotationToWorld(rotation) {
        return rotation; // true if object at origin with no rotation...
    }

    worldRotationToLocal(rotation) {
        return rotation; // true if object at origin with no rotation...
    }
}

module.exports = GameObject;
