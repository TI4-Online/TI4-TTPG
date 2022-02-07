class Border {
    constructor() {}

    setColor(color) {
        this._color = color;
        return this;
    }

    getColor() {
        return this._color;
    }

    setChild(child) {
        this._child = child;
        return this;
    }

    setChild() {
        return this._child;
    }
}

module.exports = Border;