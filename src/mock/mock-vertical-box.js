class VerticalBox {
    constructor() {
        this._children = [];
    }

    setOwningObject(owningObject) {
        this._owningObject = owningObject;
    }

    getOwningObject() {
        return this._owningObject;
    }

    addChild(widget) {
        this._children.push(widget);
    }

    getChildren() {
        return this._children;
    }
}

module.exports = VerticalBox;