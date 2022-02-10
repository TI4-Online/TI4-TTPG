const MockWidget = require("./mock-widget");
const MockColor = require("./mock-color");

class TextWidgetBase extends MockWidget {
    constructor(data) {
        super(data);
        this._text = (data && data.text) || "text";
        this._fontSize = 12;
        this._textColor = new MockColor(1, 1, 1, 1);
        this._isBold = false;
        this._isItalic = false;
        this._font = undefined;
    }
    getFontSize() {
        return this._fontSize;
    }
    getText() {
        return this._text;
    }
    getTextColor() {
        return this._textColor;
    }
    isBold() {
        return this._isBold;
    }
    isItalic() {
        return this.isItalic;
    }
    setBold(value) {
        this._isBold = value;
        return this;
    }
    setFont(value) {
        this._font = value;
        return this;
    }
    setFontSize(value) {
        this._fontSize = value;
        return this;
    }
    setItalic(value) {
        this._isItalic = value;
        return this;
    }
    setTextColor(value) {
        this._textColor = value;
        return this;
    }
    setText(value) {
        this._text = value;
        return this;
    }
}

module.exports = TextWidgetBase;
