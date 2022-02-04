const TriggerableMulticastDelegate = require("../lib/triggerable-multicast-delegate");

class Button {
    constructor() {
        this._clickEvents = [];
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

    onClicked = new TriggerableMulticastDelegate();
}

module.exports = Button;