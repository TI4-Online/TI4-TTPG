const TextWidgetBase = require("./mock-text-widget-base");

class Text extends TextWidgetBase {
    constructor(data) {
        super(data);
    }

    setAutoWrap(value) {
        return this;
    }
    setFontSize(value) {
        return this;
    }
    setJustification(value) {
        return this;
    }
    setText(value) {
        return this;
    }
}

module.exports = Text;
