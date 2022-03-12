const TextWidgetBase = require("./mock-text-widget-base");

class Text extends TextWidgetBase {
    constructor(data) {
        super(data);
    }

    setFontSize(value) {
        return this;
    }
    setText(value) {
        return this;
    }
    setJustification(value) {
        return this;
    }
}

module.exports = Text;
