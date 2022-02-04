class UIElement {
    constructor() {}

    setOwningObject(owningObject) {
        this._owningObject = owningObject;
    }

    getOwningObject() {
        return this._owningObject;
    }
}

module.exports = UIElement;