const Widget = require("./mock-widget");

class VerticalBox extends Widget {
    constructor(data) {
        super(data);
        this._children = [];
    }

    addChild(widget) {
        this._children.push(widget);
    }

    getChildren() {
        return this._children;
    }
}

module.exports = VerticalBox;
