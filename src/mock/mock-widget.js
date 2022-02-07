class Widget {
    constructor(data) {
        this._owningObject = (data && data.owningObject) || undefined;
    }

    getOwningObject() {
        return this._owningObject;
    }
}

module.exports = Widget;
