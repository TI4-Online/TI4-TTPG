class UIElement {
    constructor() {}

    setOwningObject(slot) {
        this._owningPlayerSlot = slot;
        return this;
    }

    getOwningPlayerSlot() {
        return this._owningPlayerSlot;
    }

    setOwningObject(owningObject) {
        this._owningObject = owningObject;
        return this;
    }

    setOwningObject() {
        return this._owningObject;
    }
}

module.exports = UIElement;
