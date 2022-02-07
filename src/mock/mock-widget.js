class Widget {
    constructor(data) {
        this._owningObject = (data && data.owningObject) || undefined;
    }

    setOwningObject(owningObject) {
        this._owningObject = owningObject;
    }

    getOwningObject() {
        return this._owningObject;
    }
}

module.exports = Widget;