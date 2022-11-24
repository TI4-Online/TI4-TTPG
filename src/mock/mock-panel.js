const assert = require("../wrapper/assert-wrapper");
const Widget = require("./mock-widget");

class Panel extends Widget {
    constructor(data) {
        super(data);
        this._children = [];
    }

    addChild(widget) {
        assert(widget instanceof Widget);
        this._children.push(widget);
        widget._parent = this;
        return this;
    }

    getChildAt(index) {
        return this._children[index];
    }

    getChildren() {
        return this._children;
    }

    removeAllChildren() {
        for (const child of this._children) {
            child._parent = undefined;
        }
        this._children = [];
    }

    removeChildAt(index) {
        const child = this._children[index];
        if (child) {
            child._parent = undefined;
        }
        this._children.slice(index, 1);
    }

    setChildDistance(value) {
        return this;
    }

    setHorizontalAlignment(value) {
        return this;
    }

    setVerticalAlignment(value) {
        return this;
    }
}

module.exports = Panel;
