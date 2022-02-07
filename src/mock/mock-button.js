const TriggerableMulticastDelegate = require("../lib/triggerable-multicast-delegate");
const MockTextWidgetBase = require("./mock-text-widget-base");

class Button extends MockTextWidgetBase {
    constructor(data) {
        super(data);
    }

    onClicked = new TriggerableMulticastDelegate();
}

module.exports = Button;
