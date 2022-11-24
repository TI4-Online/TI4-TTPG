const TextWidgetBase = require("./mock-text-widget-base");
const TriggerableMulticastDelegate = require("../lib/triggerable-multicast-delegate");

class TextBox extends TextWidgetBase {
    constructor(data) {
        super(data);
        this.onTextChanged = new TriggerableMulticastDelegate();
        this.onTextCommited = new TriggerableMulticastDelegate();
    }

    setText(value) {
        return this;
    }
}

module.exports = TextBox;
