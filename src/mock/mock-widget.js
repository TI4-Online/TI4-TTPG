class Widget {
    constructor(data) {
        this._owningObject = (data && data.owningObject) || undefined;
        this._enabled = true;
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

    isEnabled() {
        return this._enabled;
    }

    setEnabled(value) {
        this._enabled = value;
        return this;
    }
}

module.exports = Widget;
