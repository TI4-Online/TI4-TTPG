const Widget = require("./mock-widget");

class LayoutBox extends Widget {
    constructor() {
        super();
        this._child = undefined;
    }
    getChild() {
        return this._child;
    }
    setChild(child) {
        if (this._child) {
            this._child._parent = undefined;
        }
        this._child = child;
        if (child) {
            child._parent = this;
        }
        return this;
    }
    setHorizontalAlignment(value) {
        return this;
    }
    setMaximumHeight(value) {
        return this;
    }
    setMinimumHeight(value) {
        return this;
    }
    setMaximumWidth(value) {
        return this;
    }
    setMinimumWidth(value) {
        return this;
    }
    setOverrideHeight(value) {
        return this;
    }
    setOverrideWidth(value) {
        return this;
    }
    setPadding(left, right, top, bottom) {
        return this;
    }
    setVerticalAlignment(value) {
        return this;
    }
}

module.exports = LayoutBox;
