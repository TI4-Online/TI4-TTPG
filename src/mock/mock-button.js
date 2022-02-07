const TriggerableMulticastDelegate = require("../lib/triggerable-multicast-delegate");

class Button {
    constructor(data) {
        this._clickEvents = [];
        this._owningObject = (data && data.owningObject) || undefined;
    }

    setText(text) {
        this._text = text;
        return this;
    }

    getText() {
        return this._text;
    }

    setFontSize(fontSize) {
        this._fontSize = fontSize;
        return this;
    }

    getFontSize() {
        return this._fontSize;
    }

    getOwningObject() {
        return this._owningObject;
    }

    onClicked = new TriggerableMulticastDelegate();
}

module.exports = Button;