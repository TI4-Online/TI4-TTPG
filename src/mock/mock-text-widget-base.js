const Widget = require("./mock-widget");

class TextWidgetBase extends Widget {
    constructor(data) {
        super(data);
        this._text = (data && data.text) || undefined;
        this._fontSize = (data && data.fontSize) || undefined;
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
}

module.exports = TextWidgetBase;
