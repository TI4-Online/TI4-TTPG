const Widget = require("./mock-widget");

class VerticalBox extends Widget {
    constructor(data) {
        super(data);
        this._children = [];
    }

    addChild(widget) {
        this._children.push(widget);
        widget._parent = this;
        return this;
    }

    getChildren() {
        return this._children;
    }

    setChildDistance() {
        return this;
    }
}

module.exports = VerticalBox;
