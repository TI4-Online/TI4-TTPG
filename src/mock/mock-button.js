const TriggerableMulticastDelegate = require("../lib/triggerable-multicast-delegate");
const TextWidgetBase = require("./mock-text-widget-base");

class Button extends TextWidgetBase {
    constructor(data) {
        super(data);
        this._clickEvents = [];
        this._owningObject = (data && data.owningObject) || undefined;
    }

    onClicked = new TriggerableMulticastDelegate();
}

module.exports = Button;
