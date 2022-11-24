class Widget {
    constructor(data) {
        this._owningObject = (data && data.owningObject) || undefined;
        this._enabled = true;
        this._parent = undefined;
    }

    getOwningObject() {
        return this._owningObject;
    }

    getParent() {
        return this._parent;
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
