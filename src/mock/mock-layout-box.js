const assert = require("../wrapper/assert-wrapper");
const Widget = require("./mock-widget");

class LayoutBox extends Widget {
    constructor() {
        super();
        this._child = undefined;
    }
    getChild() {
        return this._child;
    }
    setChild(value) {
        assert(value instanceof Widget);
        this._child = value;
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
