class Widget {
    constructor(data) {
        this._owningObject = (data && data.owningObject) || undefined;
    }

    getOwningObject() {
        return this._owningObject;
    }

    getParent() {
        return this._parent;
    }

    getChild() {
        return this._child;
    }
}

module.exports = Widget;
