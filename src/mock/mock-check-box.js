const TriggerableMulticastDelegate = require("../lib/triggerable-multicast-delegate");
const TextWidgetBase = require("./mock-text-widget-base");

class Button extends TextWidgetBase {
    constructor(data) {
        super(data);
    }

    onCheckStateChanged = new TriggerableMulticastDelegate();

    setIsChecked(value) {
        return this;
    }
}

module.exports = Button;
