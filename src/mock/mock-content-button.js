const TriggerableMulticastDelegate = require("../lib/triggerable-multicast-delegate");
const Widget = require("./mock-widget");

class ContentButton extends Widget {
    constructor(data) {
        super(data);
        this._child = (data && data.child) || undefined;
        this.onClicked = new TriggerableMulticastDelegate();
    }

    getChild() {
        return this._child;
    }

    setChild(child) {
        if (this._child) {
            this._child._parent = undefined;
        }
        this._child = child;
        if (child) {
            child._parent = this;
        }
        return this;
    }
}

module.exports = ContentButton;
