const TriggerableMulticastDelegate = require("../lib/triggerable-multicast-delegate");
const MockTextWidgetBase = require("./mock-text-widget-base");

class Button extends MockTextWidgetBase {
    constructor() {
        super();
        this.onClicked = new TriggerableMulticastDelegate();
        this._text = "";
    }

    getText() {
        return this._text;
    }
    setText(value) {
        this._text = value;
        return this;
    }
}

module.exports = Button;
