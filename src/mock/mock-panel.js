const Widget = require("./mock-widget");

class Panel extends Widget {
    constructor(data) {
        super(data);
        this._children = [];
    }

    addChild(widget) {
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

    removeAllChildren() {}

    removeChildAt(index) {}

    setChildDistance() {
        return this;
    }
}

module.exports = Panel;
