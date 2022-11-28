class Widget {
    constructor(data) {
        this._owningObject = (data && data.owningObject) || undefined;
        this._enabled = true;
        this._parent = undefined;
        this._visible = true;
    }

    getOwningObject() {
        return this._owningObject;
    }

    getParent() {
        return this._parent;
    }

    getVisible() {
        return this._visible;
    }

    isEnabled() {
        return this._enabled;
    }

    setEnabled(value) {
        this._enabled = value;
        return this;
    }

    setVisible(value) {
        this._visible = value;
        return this;
    }
}

module.exports = Widget;
