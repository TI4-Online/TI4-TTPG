const Widget = require("./mock-widget");

class Border extends Widget {
    constructor(data) {
        super(data);
        this._color = (data && data.color) || undefined;
        this._child = (data && data.child) || undefined;
    }

    setColor(color) {
        this._color = color;
        return this;
    }

    getColor() {
        return this._color;
    }

    setChild(child) {
        this._child = child;
        child._parent = this;
        return this;
    }
}

module.exports = Border;
