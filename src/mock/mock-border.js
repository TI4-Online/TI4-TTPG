const Widget = require("./mock-widget");

class Border extends Widget {
    constructor(data) {
        super(data);
        this._color = (data && data.color) || undefined;
        this._child = (data && data.child) || undefined;
    }

    getChild() {
        return this._child;
    }

    getColor() {
        return this._color;
    }

    setChild(child) {
        if (this._child) {
            this._child._parent = undefined;
        }
        this._child = child;
        child._parent = this;
        return this;
    }

    setColor(color) {
        this._color = color;
        return this;
    }
}

module.exports = Border;
